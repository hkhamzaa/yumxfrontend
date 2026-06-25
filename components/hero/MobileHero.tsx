'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import Link from 'next/link'
import SplitText from '@/components/ui/SplitText'
import { useLoadingReporter } from '@/components/loader/LoadingProvider'
import { HERO_CLIPS, frameUrl } from '@/lib/heroFrames'

// Autoplay clip that plays first (clip 0). The three scroll-scrubbed clips
// (burger → wings → fries) are pre-rendered image frames served from Cloudinary.
const AUTOPLAY_SRC = '/videos/hero-video.mp4'

const DWELL_VH = 50
const FADE     = 0.4

// Scroll smoothing — snappy enough to track the finger (no lag) yet smoothed so
// micro-jitter never shows. Velocity scaling near-direct-maps on fast flicks.
const LERP_BASE  = 0.22
const LERP_SCALE = 0.22
const LERP_CAP   = 0.9

/**
 * Device tier — decides how many frames to load and how heavy each one is, so
 * the weakest phone on the slowest link still loads fast and scrubs smoothly:
 *   target    = frames per clip after subsampling (fewer = less data + decode)
 *   transform = Cloudinary delivery (smaller width = far cheaper to decode/draw)
 *   dpr       = canvas backing-store density cap (lower = less GPU fill)
 *   pool      = parallel downloads (higher = faster load, but more CPU)
 */
type Tier = { target: number; transform: string; dpr: number; pool: number }
// High-end: AVIF (f_auto) is the smallest download and these phones decode it
// easily. Mid/low: FORCE WebP — it's both smaller here *and* far cheaper to
// decode than AVIF, which is what makes weak phones render fast.
const TIER_HIGH: Tier = { target: 64, transform: 'f_auto,q_auto:eco',        dpr: 2,    pool: 12 }
const TIER_MID:  Tier = { target: 44, transform: 'f_webp,q_auto:low,w_560',  dpr: 1.5,  pool: 8  }
const TIER_LOW:  Tier = { target: 30, transform: 'f_webp,q_auto:low,w_420',  dpr: 1.25, pool: 6  }

function detectTier(): Tier {
  if (typeof navigator === 'undefined') return TIER_HIGH
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean }
    deviceMemory?: number
  }
  const conn = nav.connection || {}
  const et   = conn.effectiveType || '4g'
  const save = !!conn.saveData
  const mem  = nav.deviceMemory ?? 4

  if (save || mem <= 2 || et === '2g' || et === 'slow-2g') return TIER_LOW
  if (mem <= 4 || et === '3g')                              return TIER_MID
  return TIER_HIGH
}

/** Pick ~`target` evenly-spaced frames, always keeping the first and last. */
function subsampleToTarget<T>(arr: T[], target: number): T[] {
  const n = arr.length
  if (target <= 0 || target >= n) return arr
  const step = Math.max(1, Math.round(n / target))
  if (step <= 1) return arr
  const out: T[] = []
  for (let i = 0; i < n; i += step) out.push(arr[i])
  if (out[out.length - 1] !== arr[n - 1]) out.push(arr[n - 1])
  return out
}

const CLIP_TEXTS: { pre: string; accent: string }[] = [
  { pre: 'Stacked &', accent: 'Bold'  },
  { pre: 'Saucy &',   accent: 'Wild'  },
  { pre: 'Golden &',  accent: 'Crisp' },
]

const CLIP_TEXT_POSITIONS = ['bottom-28 left-5', 'bottom-28 left-5', 'bottom-28 left-5']
const CLIP_TEXT_ALIGNS    = ['left', 'left', 'left'] as const

const CLIP_COUNT = HERO_CLIPS.length          // 3 scroll clips
const count      = CLIP_COUNT + 1             // + autoplay layer

function clamp01(n: number) { return n < 0 ? 0 : n > 1 ? 1 : n }

function smoothstep(n: number) {
  const t = clamp01(n)
  return t * t * (3 - 2 * t)
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  const iw = img.naturalWidth, ih = img.naturalHeight
  if (!iw || !ih) return
  const scale = Math.max(cw / iw, ch / ih)
  const w = iw * scale
  const h = ih * scale
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h)
}

export function MobileHero() {
  const sectionRef      = useRef<HTMLElement>(null)
  const videoRef        = useRef<HTMLVideoElement | null>(null)
  const layerRefs       = useRef<(HTMLDivElement | null)[]>([])
  const canvasRefs      = useRef<(HTMLCanvasElement | null)[]>([])
  const ctxRefs         = useRef<(CanvasRenderingContext2D | null)[]>([])
  const textOverlayRefs = useRef<(HTMLDivElement | null)[]>([])
  const textRef         = useRef<HTMLDivElement>(null)
  const scrollHintRef   = useRef<HTMLDivElement>(null)
  const rafRef          = useRef<number>(0)

  // Device tier is stable for the component's life. Computed in a state
  // initializer so it's ready synchronously for canvas sizing; it affects only
  // imperative loading/drawing, never the SSR markup, so no hydration mismatch.
  const [tier] = useState<Tier>(detectTier)

  // Per-clip frame URLs after subsampling for this tier.
  const clipFrames = useMemo(
    () => HERO_CLIPS.map(c => subsampleToTarget(c.ids, tier.target).map(id => frameUrl(id, tier.transform))),
    [tier]
  )

  // Image elements + load flags (compressed in memory; decoded on draw and
  // LRU-evicted by the browser — no pinning of hundreds of decoded frames).
  const imagesRef    = useRef<(HTMLImageElement | null)[][]>([])
  const loadedRef    = useRef<boolean[][]>([])
  const frameTotals  = useRef<number[]>(clipFrames.map(f => f.length))
  const lastFrameIdx = useRef<number[]>(HERO_CLIPS.map(() => -1))
  const lastOpacity  = useRef<number[]>(new Array(count).fill(-1))

  const sectionTopRef = useRef(0)
  const denomRef      = useRef(1)

  const targetPRef  = useRef(0)
  const smoothPRef  = useRef(0)
  const velRef      = useRef(0)
  const prevScrollY = useRef(0)
  const prevScrollT = useRef(performance.now())

  const visibleRef = useRef(true)

  const textAnimatedRef = useRef([false, false, false])
  const [textTriggered, setTextTriggered] = useState([false, false, false])
  const [textKeys,      setTextKeys]      = useState([0, 0, 0])

  const { reportReady, setProgress: reportProgress } = useLoadingReporter()
  const videoReadyRef  = useRef(false)
  const framesDoneRef  = useRef(false)
  const heroReadyRef   = useRef(false)

  // ── Frame preloading ────────────────────────────────────────────────────────
  // Reveal gates on the autoplay video + EVERY frame of all three clips (burger,
  // wings, fries) — the whole hero is fully rendered before the page is shown.
  // Frames load through one ordered pool (burger → wings → fries) so the gate
  // finishes as fast as the device/link allows, with burger fetched first.
  useEffect(() => {
    let alive = true

    imagesRef.current    = clipFrames.map(f => f.map(() => null))
    loadedRef.current    = clipFrames.map(f => f.map(() => false))
    frameTotals.current  = clipFrames.map(f => f.length)
    lastFrameIdx.current = clipFrames.map(() => -1)

    const totalFrames = clipFrames.reduce((s, f) => s + f.length, 0)
    let loaded = 0

    const maybeReady = () => {
      if (heroReadyRef.current) return
      if (framesDoneRef.current && videoReadyRef.current) {
        heroReadyRef.current = true
        reportReady('hero')
      }
    }
    const reportFrames = () => {
      const frac = totalFrames ? loaded / totalFrames : 1
      reportProgress('hero', frac * 0.97 + (videoReadyRef.current ? 0.03 : 0))
    }

    const loadFrame = (ci: number, fi: number, priority: 'high' | 'low') => new Promise<void>(resolve => {
      if (!alive || loadedRef.current[ci]?.[fi]) return resolve()
      const img = new Image()
      img.decoding = 'async'
      try { (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = priority } catch {}
      imagesRef.current[ci][fi] = img
      const done = () => {
        if (!alive) return resolve()
        loadedRef.current[ci][fi] = true
        loaded++
        reportFrames()
        if (loaded >= totalFrames) { framesDoneRef.current = true; maybeReady(); warmDecodeCache() }
        resolve()
      }
      img.onload  = done
      img.onerror = done // count errors too, so the gate can never hang
      img.src = clipFrames[ci][fi]
    })

    // After the gate is satisfied, decode every frame once — sequentially and
    // gently, in the idle time while the user reads the hero copy — so the first
    // scrub of each frame is jank-free. This is kept OUT of the load phase so the
    // loader stays purely download-bound (fastest possible reveal).
    let warmed = false
    const warmDecodeCache = () => {
      if (warmed) return
      warmed = true
      setTimeout(async () => {
        for (const arr of imagesRef.current) {
          for (const im of arr) {
            if (!alive) return
            try { await im?.decode?.() } catch {}
          }
        }
      }, 300)
    }

    // One ordered queue across all clips (burger frames first → wings → fries),
    // drained by `pool` parallel workers for maximum throughput.
    const queue: [number, number][] = []
    for (let ci = 0; ci < CLIP_COUNT; ci++)
      for (let fi = 0; fi < clipFrames[ci].length; fi++) queue.push([ci, fi])

    let qi = 0
    const worker = async () => {
      while (alive && qi < queue.length) {
        const [ci, fi] = queue[qi++]
        await loadFrame(ci, fi, ci === 0 ? 'high' : 'low')
      }
    }
    Promise.all(Array.from({ length: Math.min(tier.pool, queue.length || 1) }, worker))

    if (totalFrames === 0) { framesDoneRef.current = true; maybeReady() }

    return () => { alive = false }
  }, [clipFrames, tier.pool, reportProgress, reportReady])

  // Autoplay video readiness (the other half of the reveal gate).
  const markVideoReady = useCallback(() => {
    if (videoReadyRef.current) return
    videoReadyRef.current = true
    if (heroReadyRef.current) return
    if (framesDoneRef.current) {
      heroReadyRef.current = true
      reportReady('hero')
    }
  }, [reportReady])

  const onHeroProgress = useCallback(() => {
    const v = videoRef.current
    if (!v || !isFinite(v.duration) || v.duration <= 0) return
    try {
      const end = v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0
      if (end / v.duration >= 0.25) markVideoReady()
    } catch {}
  }, [markVideoReady])

  useEffect(() => {
    const v = videoRef.current
    if (v && v.readyState >= 2) markVideoReady()
  }, [markVideoReady])

  // ── Canvas sizing ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, tier.dpr)
      canvasRefs.current.forEach((canvas, fi) => {
        if (!canvas) return
        canvas.width  = Math.round(window.innerWidth  * dpr)
        canvas.height = Math.round(window.innerHeight * dpr)
        const ctx = canvas.getContext('2d')
        if (ctx) { ctx.imageSmoothingQuality = 'low'; ctxRefs.current[fi] = ctx }
        lastFrameIdx.current[fi] = -1 // force redraw at new size
      })
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })
    return () => window.removeEventListener('resize', resize)
  }, [tier])

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
  }, [])

  // Nearest already-loaded frame to `idx` — guarantees the canvas always has
  // something to draw even while a background clip is still streaming.
  const pickFrame = useCallback((ci: number, idx: number): HTMLImageElement | null => {
    const imgs = imagesRef.current[ci]
    const ld   = loadedRef.current[ci]
    if (!imgs || !ld) return null
    if (ld[idx]) return imgs[idx]
    for (let d = 1; d < imgs.length; d++) {
      if (idx - d >= 0 && ld[idx - d]) return imgs[idx - d]
      if (idx + d < imgs.length && ld[idx + d]) return imgs[idx + d]
    }
    return null
  }, [])

  // ── rAF loop (self-suspends when the hero is off-screen / tab hidden) ───────────
  const update = useCallback(() => {
    if (!visibleRef.current) { rafRef.current = 0; return }

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

      const total = frameTotals.current[fi]
      if (total <= 0) continue

      const frameIdx = Math.min(total - 1, Math.floor(t * total))
      if (frameIdx === lastFrameIdx.current[fi]) continue

      const img    = pickFrame(fi, frameIdx)
      const ctx    = ctxRefs.current[fi]
      const canvas = canvasRefs.current[fi]
      if (img && ctx && canvas) {
        lastFrameIdx.current[fi] = frameIdx
        drawCover(ctx, img, canvas.width, canvas.height)
      }
    }

    // Layer opacity + visibility culling (hidden layers aren't composited).
    for (let i = 0; i < count; i++) {
      const layer = layerRefs.current[i]
      if (!layer) continue
      const o = layerOpacity(i, p)
      if (o !== lastOpacity.current[i]) {
        lastOpacity.current[i] = o
        layer.style.opacity = String(o)
        if (i > 0) layer.style.visibility = o <= 0.001 ? 'hidden' : 'visible'
      }
    }

    // Text: trigger when a layer is ~fully visible, fade out as the next arrives.
    for (let i = 0; i < CLIP_COUNT; i++) {
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
      const tt = 1 - layerOpacity(1, p)
      textRef.current.style.opacity   = String(tt)
      textRef.current.style.transform = `translateY(${(1 - tt) * -24}px)`
    }
    if (scrollHintRef.current) {
      scrollHintRef.current.style.opacity = p < 0.04 ? '0.6' : '0'
    }

    rafRef.current = requestAnimationFrame(update)
  }, [layerOpacity, pickFrame])

  const ensureLoop = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(update)
  }, [update])

  useEffect(() => {
    ensureLoop()
    return () => { cancelAnimationFrame(rafRef.current); rafRef.current = 0 }
  }, [ensureLoop])

  // ── Battery: suspend rendering + autoplay when off-screen or tab hidden ─────────
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting
      const v = videoRef.current
      if (entry.isIntersecting) {
        if (!document.hidden) { v?.play().catch(() => {}); ensureLoop() }
      } else {
        v?.pause()
      }
    }, { threshold: 0 })
    io.observe(el)

    const onVis = () => {
      const v = videoRef.current
      if (document.hidden) {
        v?.pause()
        cancelAnimationFrame(rafRef.current); rafRef.current = 0
      } else if (visibleRef.current) {
        v?.play().catch(() => {}); ensureLoop()
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [ensureLoop])

  return (
    <section
      ref={sectionRef}
      aria-label="Hero"
      style={{ height: `calc(100svh + ${CLIP_COUNT * DWELL_VH}svh)` }}
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
            ref={el => { videoRef.current = el }}
            src={AUTOPLAY_SRC}
            muted autoPlay loop playsInline preload="auto"
            onLoadedData={markVideoReady}
            onCanPlayThrough={markVideoReady}
            onError={markVideoReady}
            onProgress={onHeroProgress}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'translateZ(0)' }}
          />
        </div>

        {/* ── Clips 1–3: Cloudinary frame canvases ─────────────────────────────── */}
        {HERO_CLIPS.map((clip, fi) => {
          const i = fi + 1
          return (
            <div
              key={clip.name}
              ref={el => { layerRefs.current[i] = el }}
              className="absolute inset-0"
              style={{ opacity: 0, visibility: 'hidden', zIndex: i, willChange: 'opacity', transform: 'translateZ(0)' }}
              aria-hidden="true"
            >
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
