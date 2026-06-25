'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import Link from 'next/link'
import SplitText from '@/components/ui/SplitText'
import { useLoadingReporter } from '@/components/loader/LoadingProvider'

const VIDEOS = [
  '/videos/hero-video.mp4',
  '/videos/burger-video.mp4',
  '/videos/wings-video.mp4',
  '/videos/fries-video.mp4',
]

const DWELL_VH  = 50
const FADE      = 0.4
const FRAME_FPS = 24

const LERP_BASE  = 0.055
const LERP_SCALE = 0.12
const LERP_CAP   = 0.65
const SEEK_THR   = 1 / 30

const CLIP_TEXTS: { pre: string; accent: string }[] = [
  { pre: 'Stacked &', accent: 'Bold'  },
  { pre: 'Saucy &',   accent: 'Wild'  },
  { pre: 'Golden &',  accent: 'Crisp' },
]

const CLIP_TEXT_POSITIONS = ['bottom-28 left-5', 'bottom-28 left-5', 'bottom-28 left-5']
const CLIP_TEXT_ALIGNS    = ['left', 'left', 'left'] as const

function clamp01(n: number) { return n < 0 ? 0 : n > 1 ? 1 : n }

function smoothstep(n: number) {
  const t = clamp01(n)
  return t * t * (3 - 2 * t)
}

function drawCover(ctx: CanvasRenderingContext2D, img: ImageBitmap, cw: number, ch: number) {
  const scale = Math.max(cw / img.width, ch / img.height)
  const w = img.width  * scale
  const h = img.height * scale
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h)
}

/** Resolve when the video has its first frame ready to render. */
function waitForFirstFrame(vid: HTMLVideoElement): Promise<void> {
  return new Promise<void>((res, rej) => {
    if (vid.readyState >= 2) { res(); return }
    vid.addEventListener('loadeddata', () => res(), { once: true })
    vid.addEventListener('error',      () => rej(),  { once: true })
  })
}

export function MobileHero() {
  const sectionRef      = useRef<HTMLElement>(null)
  const videoRefs       = useRef<(HTMLVideoElement | null)[]>([])
  const layerRefs       = useRef<(HTMLDivElement | null)[]>([])
  const canvasRefs      = useRef<(HTMLCanvasElement | null)[]>([])
  const textOverlayRefs = useRef<(HTMLDivElement | null)[]>([])
  const textRef         = useRef<HTMLDivElement>(null)
  const scrollHintRef   = useRef<HTMLDivElement>(null)
  const rafRef          = useRef<number>(0)

  const framesRef      = useRef<(ImageBitmap[] | null)[]>([null, null, null])
  const lastFrameIdx   = useRef([-1, -1, -1])
  // Set as soon as duration is known — keeps the t→frame mapping stable
  // while extraction is still in progress (prevents index jumps).
  const frameTotalsRef = useRef([0, 0, 0])

  const extractAbortCtrlRef = useRef<AbortController | null>(null)

  const sectionTopRef = useRef(0)
  const denomRef      = useRef(1)

  const targetPRef  = useRef(0)
  const smoothPRef  = useRef(0)
  const velRef      = useRef(0)
  const prevScrollY = useRef(0)
  const prevScrollT = useRef(performance.now())

  const textAnimatedRef = useRef([false, false, false])
  const [textTriggered, setTextTriggered] = useState([false, false, false])
  const [textKeys,      setTextKeys]      = useState([0, 0, 0])

  const count = VIDEOS.length

  const { reportReady, setProgress: reportProgress } = useLoadingReporter()
  const heroReadyRef = useRef(false)

  // ── Extraction ────────────────────────────────────────────────────────────────

  /**
   * Extracts all frames for one clip at CSS-pixel resolution (not native video
   * resolution). Storing at CSS-pixel size gives 4-9× memory savings on high-DPR
   * devices, which is what makes 24 fps sustainable. The `frames` array is exposed
   * to the rAF loop immediately so partial results are used progressively — the
   * video-seek fallback handles any positions not yet extracted.
   */
  const extractAllFrames = useCallback(async (
    src: string, fi: number, signal: AbortSignal,
  ) => {
    const capW = Math.ceil(window.innerWidth)
    const capH = Math.ceil(window.innerHeight)

    const vid = document.createElement('video')
    vid.src = src; vid.muted = true; vid.playsInline = true; vid.preload = 'auto'
    vid.load()

    await waitForFirstFrame(vid)
    if (signal.aborted) { vid.src = ''; return }

    const duration = vid.duration
    if (!isFinite(duration) || duration <= 0) { vid.src = ''; return }

    const total = Math.ceil(duration * FRAME_FPS)
    frameTotalsRef.current[fi] = total

    // One off-screen canvas per clip, reused for all frames to avoid GC churn
    const oc = document.createElement('canvas')
    oc.width = capW; oc.height = capH
    const octx = oc.getContext('2d')
    if (!octx) { vid.src = ''; return }

    const frames: ImageBitmap[] = []
    framesRef.current[fi] = frames   // rAF picks up frames as they arrive

    for (let f = 0; f < total; f++) {
      if (signal.aborted) break

      if (f > 0) {
        vid.currentTime = f / FRAME_FPS
        await new Promise<void>(r => vid.addEventListener('seeked', () => r(), { once: true }))
        if (signal.aborted) break
      }

      try {
        const vw = vid.videoWidth  > 0 ? vid.videoWidth  : capW
        const vh = vid.videoHeight > 0 ? vid.videoHeight : capH
        const sc = Math.max(capW / vw, capH / vh)
        octx.clearRect(0, 0, capW, capH)
        octx.drawImage(vid, (capW - vw * sc) / 2, (capH - vh * sc) / 2, vw * sc, vh * sc)
        frames.push(await createImageBitmap(oc))
      } catch {
        break   // createImageBitmap unsupported — video-seek fallback stays active
      }

      // Yield one macrotask so rAF and scroll events aren't starved between seeks
      await new Promise<void>(r => setTimeout(r, 0))
    }

    vid.src = ''; vid.load()
  }, [])

  const startFrameExtraction = useCallback(async () => {
    const ac = new AbortController()
    extractAbortCtrlRef.current = ac

    // Preload in-DOM fallback videos so video-seeking is ready immediately
    videoRefs.current.slice(1).forEach(v => {
      if (v) { v.preload = 'auto'; v.load() }
    })

    // All 3 clips extract IN PARALLEL — 3× faster than the old sequential approach
    await Promise.all(
      VIDEOS.slice(1).map((src, fi) =>
        extractAllFrames(src, fi, ac.signal).catch(() => {}),
      ),
    )
  }, [extractAllFrames])

  // Close all bitmaps when the component unmounts
  useEffect(() => {
    return () => {
      extractAbortCtrlRef.current?.abort()
      framesRef.current.forEach(frames => frames?.forEach(b => b.close()))
    }
  }, [])

  // ── Hero ready ────────────────────────────────────────────────────────────────

  const markHeroReady = useCallback(() => {
    if (heroReadyRef.current) return
    heroReadyRef.current = true
    reportReady('hero')
    startFrameExtraction()
  }, [reportReady, startFrameExtraction])

  const onHeroProgress = useCallback(() => {
    const v = videoRefs.current[0]
    if (!v || !isFinite(v.duration) || v.duration <= 0) return
    try {
      const end = v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0
      reportProgress('hero', end / v.duration)
    } catch {}
  }, [reportProgress])

  useEffect(() => {
    const v = videoRefs.current[0]
    if (v && v.readyState >= 2) markHeroReady()
  }, [markHeroReady])

  useEffect(() => {
    videoRefs.current.slice(1).forEach(v => { if (v) v.pause() })
  }, [])

  // ── Canvas sizing ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvasRefs.current.forEach((canvas, fi) => {
        if (!canvas) return
        canvas.width  = Math.round(window.innerWidth  * dpr)
        canvas.height = Math.round(window.innerHeight * dpr)
        lastFrameIdx.current[fi] = -1
      })
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ── Section geometry ──────────────────────────────────────────────────────────
  const calcGeometry = useCallback(() => {
    const el = sectionRef.current
    if (!el) return
    sectionTopRef.current = el.getBoundingClientRect().top + window.scrollY
    denomRef.current      = Math.max(1, el.offsetHeight - window.innerHeight)
  }, [])

  useEffect(() => {
    calcGeometry()
    window.addEventListener('resize', calcGeometry, { passive: true })
    return () => window.removeEventListener('resize', calcGeometry)
  }, [calcGeometry])

  // ── Passive scroll listener ───────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const now = performance.now()
      const dt  = now - prevScrollT.current
      if (dt > 0) velRef.current = Math.abs((window.scrollY - prevScrollY.current) / dt)
      prevScrollY.current = window.scrollY
      prevScrollT.current = now
      targetPRef.current  = clamp01((window.scrollY - sectionTopRef.current) / denomRef.current)
    }
    prevScrollY.current = window.scrollY
    prevScrollT.current = performance.now()
    targetPRef.current  = clamp01((window.scrollY - sectionTopRef.current) / denomRef.current)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Layer opacity ─────────────────────────────────────────────────────────────
  const layerOpacity = useCallback((i: number, p: number) => {
    if (i === 0) return 1
    const seg      = 1 / count
    const boundary = i * seg
    const halfFade = (seg * FADE) / 2
    return smoothstep((p - (boundary - halfFade)) / (halfFade * 2))
  }, [count])

  // ── rAF loop ──────────────────────────────────────────────────────────────────
  const update = useCallback(() => {
    const lerp = Math.min(LERP_CAP, LERP_BASE + velRef.current * LERP_SCALE)
    smoothPRef.current += (targetPRef.current - smoothPRef.current) * lerp
    velRef.current *= 0.88

    const p   = smoothPRef.current
    const seg = 1 / count

    for (let i = 1; i < count; i++) {
      const op  = layerOpacity(i, p)
      const nOp = i + 1 < count ? layerOpacity(i + 1, p) : 0
      if (op <= 0.01 && nOp <= 0.01) continue

      const t  = clamp01((p - i * seg) / seg)
      const fi = i - 1

      const frames = framesRef.current[fi]
      const canvas = canvasRefs.current[fi]
      const total  = frameTotalsRef.current[fi]
      const frameIdx = total > 0 ? Math.floor(t * total) : -1

      if (frames && canvas && frameIdx >= 0 && frameIdx < frames.length) {
        // Exact extracted frame is available — draw it to canvas (covers video)
        if (frameIdx !== lastFrameIdx.current[fi]) {
          lastFrameIdx.current[fi] = frameIdx
          const ctx = canvas.getContext('2d')
          if (ctx) drawCover(ctx, frames[frameIdx], canvas.width, canvas.height)
        }
      } else {
        // Frame not yet extracted — clear canvas so video shows through, then seek it
        if (canvas && lastFrameIdx.current[fi] !== -2) {
          lastFrameIdx.current[fi] = -2
          const ctx = canvas.getContext('2d')
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
        const v = videoRefs.current[i]
        if (v && isFinite(v.duration) && v.duration > 0) {
          const target = t * v.duration
          if (Math.abs(v.currentTime - target) > SEEK_THR) v.currentTime = target
        }
      }
    }

    for (let i = 0; i < count; i++) {
      const layer = layerRefs.current[i]
      if (layer) layer.style.opacity = String(layerOpacity(i, p))
    }

    // Text: trigger when layer is fully visible (≥95%) for maximum animation
    // window before the next layer's crossfade fades the overlay out.
    for (let i = 0; i < 3; i++) {
      const overlay  = textOverlayRefs.current[i]
      const layerVis = layerOpacity(i + 1, p)

      if (overlay) {
        const fadeOut = i + 2 < count ? layerOpacity(i + 2, p) : 0
        overlay.style.opacity = textAnimatedRef.current[i]
          ? String(layerVis * (1 - fadeOut))
          : '0'
      }

      if (layerVis >= 0.95 && !textAnimatedRef.current[i]) {
        textAnimatedRef.current[i] = true
        setTextTriggered(prev => { const n = [...prev]; n[i] = true; return n })
      } else if (layerVis < 0.3 && textAnimatedRef.current[i]) {
        textAnimatedRef.current[i] = false
        setTextTriggered(prev => { const n = [...prev]; n[i] = false; return n })
        setTextKeys(prev => { const n = [...prev]; n[i]++; return n })
      }
    }

    if (textRef.current) {
      const t = 1 - layerOpacity(1, p)
      textRef.current.style.opacity   = String(t)
      textRef.current.style.transform = `translateY(${(1 - t) * -24}px)`
    }
    if (scrollHintRef.current) {
      scrollHintRef.current.style.opacity = p < 0.04 ? '0.6' : '0'
    }

    rafRef.current = requestAnimationFrame(update)
  }, [count, layerOpacity])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [update])

  return (
    <section
      ref={sectionRef}
      aria-label="Hero"
      style={{ height: `calc(100svh + ${count * DWELL_VH}svh)` }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">

        {/* ── Clip 0: autoplay ─────────────────────────────────────────────────── */}
        <div
          ref={el => { layerRefs.current[0] = el }}
          className="absolute inset-0"
          style={{ opacity: 1, zIndex: 0, willChange: 'opacity', transform: 'translateZ(0)' }}
          aria-hidden="true"
        >
          <video
            ref={el => { videoRefs.current[0] = el }}
            src={VIDEOS[0]}
            muted autoPlay loop playsInline preload="auto"
            onLoadedData={markHeroReady}
            onCanPlayThrough={markHeroReady}
            onError={markHeroReady}
            onProgress={onHeroProgress}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'translateZ(0)' }}
          />
        </div>

        {/* ── Clips 1–3: canvas (frames) + video fallback ───────────────────────── */}
        {VIDEOS.slice(1).map((src, fi) => {
          const i = fi + 1
          return (
            <div
              key={src}
              ref={el => { layerRefs.current[i] = el }}
              className="absolute inset-0"
              style={{ opacity: 0, zIndex: i, willChange: 'opacity', transform: 'translateZ(0)' }}
              aria-hidden="true"
            >
              {/* Fallback video — metadata preloads immediately so duration is ready for seeking */}
              <video
                ref={el => { videoRefs.current[i] = el }}
                src={src}
                muted playsInline preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'translateZ(0)' }}
              />
              {/* Canvas on top — shows frame 0 within ~300 ms of hero ready,
                  then progressively sharper scrubbing as more frames arrive */}
              <canvas
                ref={el => { canvasRefs.current[fi] = el }}
                className="absolute inset-0 w-full h-full"
                style={{ transform: 'translateZ(0)' }}
              />
            </div>
          )
        })}

        {/* ── Gradient veil ─────────────────────────────────────────────────────── */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-brand-bg/40 via-transparent to-brand-bg/80" />

        {/* ── Text badges for clips 1–3 ─────────────────────────────────────────── */}
        {[0, 1, 2].map(i => (
          <div
            key={i}
            ref={el => { textOverlayRefs.current[i] = el }}
            className={`absolute z-30 pointer-events-none max-w-[80vw] ${CLIP_TEXT_POSITIONS[i]}`}
            style={{ opacity: 0, willChange: 'opacity' }}
          >
            <div style={{
              background: 'rgba(0,0,0,0.38)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderRadius: '12px',
              padding: '14px 22px',
            }}>
              <SplitText
                key={`pre-${textKeys[i]}`}
                text={CLIP_TEXTS[i].pre}
                tag="p"
                triggered={textTriggered[i]}
                className="font-display font-bold text-3xl text-white/90 tracking-tight leading-none"
                delay={40} duration={1.7} ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 16 }} to={{ opacity: 1, y: 0 }}
                textAlign={CLIP_TEXT_ALIGNS[i]}
              />
              <SplitText
                key={`acc-${textKeys[i]}`}
                text={CLIP_TEXTS[i].accent}
                tag="p"
                triggered={textTriggered[i]}
                className="font-display font-bold text-5xl italic text-brand-accent tracking-tight leading-none"
                delay={55} duration={2} ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 30 }} to={{ opacity: 1, y: 0 }}
                textAlign={CLIP_TEXT_ALIGNS[i]}
              />
            </div>
          </div>
        ))}

        {/* ── Hero text ─────────────────────────────────────────────────────────── */}
        <div
          ref={textRef}
          className="absolute inset-0 z-20 flex flex-col justify-end px-6 pb-20"
          style={{ willChange: 'opacity, transform' }}
        >
          <div className="max-w-[90vw] animate-fade-in">
            <p className="label-caps text-brand-accent mb-4">
              Lahore&apos;s Boldest Fast Food
            </p>
            <h1 className="font-display font-bold text-[clamp(2.75rem,11vw,4rem)] leading-[1.05] text-brand-text tracking-tight">
              Real Food.<br />
              <span className="text-brand-accent italic">Fast.</span>
            </h1>
            <p className="font-body text-base text-brand-muted leading-relaxed mt-4 mb-7 max-w-sm">
              Crafted with bold flavours, served fast.
              Every bite hits different.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/menu"
                className="font-body font-bold text-sm px-8 py-4 rounded-squoval bg-brand-accent text-brand-bg hover:bg-white hover:text-brand-bg transition-all duration-300 ease-in-out text-center"
              >
                Explore Menu
              </Link>
              <Link
                href="/menu#deals"
                className="font-body font-bold text-sm px-8 py-4 rounded-squoval border-[1.5px] border-white/30 text-brand-text hover:bg-white hover:border-white hover:text-brand-bg transition-all duration-300 ease-in-out text-center"
              >
                See Deals
              </Link>
            </div>
          </div>
        </div>

        {/* ── Scroll hint ───────────────────────────────────────────────────────── */}
        <div
          ref={scrollHintRef}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
          style={{ opacity: 0.6, willChange: 'opacity' }}
        >
          <span className="label-caps text-brand-muted">Scroll</span>
          <div className="w-px h-9 bg-gradient-to-b from-brand-muted to-transparent animate-pulse" />
        </div>

      </div>
    </section>
  )
}
