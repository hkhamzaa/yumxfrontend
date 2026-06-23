'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import Link from 'next/link'
import SplitText from '@/components/ui/SplitText'
import { useLoadingReporter } from '@/components/loader/LoadingProvider'

// 9:16 portrait clips, scrubbed by scroll on mobile. Order = scroll order.
const VIDEOS = [
  '/videos/hero-video.mp4',
  '/videos/burger-video.mp4',
  '/videos/wings-video.mp4',
  '/videos/fries-video.mp4',
]

// Scroll "dwell" per clip, in svh. Section height = 100svh sticky + dwell.
const DWELL_VH = 50
// Fraction of each segment spent crossfading into the next clip.
const FADE = 0.4

// Short punchy text for clips 1 (burger), 2 (wings), 3 (fries)
const CLIP_TEXTS: { pre: string; accent: string }[] = [
  { pre: 'Stacked &', accent: 'Bold'  },
  { pre: 'Saucy &',   accent: 'Wild'  },
  { pre: 'Golden &',  accent: 'Crisp' },
]

// Absolute position tailwind classes per clip text overlay
const CLIP_TEXT_POSITIONS = [
  'bottom-28 left-5',
  'bottom-28 left-5',
  'bottom-28 left-5',
]

// Text alignment per overlay
const CLIP_TEXT_ALIGNS = ['left', 'left', 'left'] as const

function clamp01(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n
}

function smoothstep(n: number) {
  const t = clamp01(n)
  return t * t * (3 - 2 * t)
}

/**
 * Mobile hero: a pinned stack of portrait videos. Scroll progress (0→1)
 * crossfades hero → burger → wings → fries, then releases into the page.
 * Videos are stacked bottom→top; each upper clip fades in over the one below
 * across its segment boundary, so once faded in it fully covers the prior clip.
 *
 * When each food clip reaches its second-to-last second a glassmorphic text
 * badge animates in using SplitText char-by-char.
 */
export function MobileHero() {
  const sectionRef      = useRef<HTMLElement>(null)
  const videoRefs       = useRef<(HTMLVideoElement | null)[]>([])
  const layerRefs       = useRef<(HTMLDivElement | null)[]>([])
  const textOverlayRefs = useRef<(HTMLDivElement | null)[]>([])
  const textRef         = useRef<HTMLDivElement>(null)
  const scrollHintRef   = useRef<HTMLDivElement>(null)
  const rafRef          = useRef<number>(0)
  const activeRef       = useRef(-1)
  const endedRef        = useRef<Set<number>>(new Set())
  // Furthest clip the user is allowed to reach. Advances once the current clip's
  // video has played fully OR the user makes a second attempt to scroll past it,
  // so a fast/heavy scroll can't skip a clip on the first try.
  // Starts at 1: the looping hero (clip 0) never gates.
  const allowedClipRef  = useRef(1)
  // True while the user is parked against the active gate (held by the clamp).
  const atGateRef       = useRef(false)
  // Timestamp of the last wheel event, used to detect a fresh wheel gesture.
  const lastWheelRef    = useRef(0)

  // rAF-accessible flags — avoids state reads inside the animation loop
  const textAnimatedRef = useRef([false, false, false])
  // React state to drive SplitText re-renders
  const [textTriggered, setTextTriggered] = useState([false, false, false])
  // Increment to force-remount SplitText (resets its internal animation state)
  const [textKeys, setTextKeys] = useState([0, 0, 0])

  const count = VIDEOS.length

  // Report load state of the first (visible) clip to the page loader. The hero is
  // "rendered fully" once that clip's first frame is decoded; later clips stream
  // in lazily as the user scrolls and must not gate the loader.
  const { reportReady, setProgress: reportProgress } = useLoadingReporter()
  const heroReadyRef = useRef(false)

  const markHeroReady = useCallback(() => {
    if (heroReadyRef.current) return
    heroReadyRef.current = true
    reportReady('hero')
  }, [reportReady])

  const onHeroProgress = useCallback(() => {
    const v = videoRefs.current[0]
    if (!v || !isFinite(v.duration) || v.duration <= 0) return
    try {
      const end = v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0
      reportProgress('hero', end / v.duration)
    } catch { /* buffered can throw mid-load — ignore */ }
  }, [reportProgress])

  // Catch the case where the clip is already buffered before listeners attach.
  useEffect(() => {
    const v = videoRefs.current[0]
    if (v && v.readyState >= 2 /* HAVE_CURRENT_DATA */) markHeroReady()
  }, [markHeroReady])

  /* Opacity of clip `i` at scroll progress `p` (0..1 over the whole section). */
  const layerOpacity = useCallback((i: number, p: number) => {
    if (i === 0) return 1
    const seg = 1 / count
    const boundary = i * seg
    const halfFade = (seg * FADE) / 2
    return smoothstep((p - (boundary - halfFade)) / (halfFade * 2))
  }, [count])

  /* rAF-driven scroll sync: write opacities directly, toggle play/pause. */
  const update = useCallback(() => {
    const el = sectionRef.current
    if (!el) return
    const rect  = el.getBoundingClientRect()
    const denom = rect.height - window.innerHeight
    let p = denom > 0 ? clamp01(-rect.top / denom) : 0

    // ── Forward gate ────────────────────────────────────────────────
    // Hold the page at the current clip until its video has played fully,
    // so a fast/heavy scroll can't fling past a clip before it plays.
    // Only forward overshoot is clamped — scrolling back up stays free.
    const allowed = allowedClipRef.current
    if (denom > 0 && allowed < count) {
      const seg      = 1 / count
      const halfFade = (seg * FADE) / 2
      const maxP     = (allowed + 1) * seg - halfFade
      if (p > maxP) {
        const sectionAbsTop = rect.top + window.scrollY
        window.scrollTo(0, sectionAbsTop + maxP * denom)
        p = maxP
      }
      // Parked against the gate → a fresh scroll gesture counts as a 2nd try.
      atGateRef.current = p >= maxP - 0.004
    } else {
      atGateRef.current = false
    }

    let topMost = 0
    for (let i = 0; i < count; i++) {
      const o = layerOpacity(i, p)
      const layer = layerRefs.current[i]
      if (layer) layer.style.opacity = String(o)
      if (o >= 0.5) topMost = i
    }

    // Drive text overlay visibility: fade in with its clip, fade out when next clip fades in
    for (let i = 0; i < 3; i++) {
      const overlay = textOverlayRefs.current[i]
      if (overlay) {
        const fadeIn  = layerOpacity(i + 1, p)
        const fadeOut = i + 2 < count ? layerOpacity(i + 2, p) : 0
        const clipOp  = fadeIn * (1 - fadeOut)
        overlay.style.opacity = textAnimatedRef.current[i] ? String(clipOp) : '0'
      }
    }

    if (topMost !== activeRef.current) {
      activeRef.current = topMost
      videoRefs.current.forEach((v, i) => {
        if (!v) return
        if (i === topMost) {
          if (i > 0 && endedRef.current.has(i)) {
            endedRef.current.delete(i)
            v.currentTime = 0
            // Reset the text badge so it can animate again on replay
            const ti = i - 1
            if (textAnimatedRef.current[ti]) {
              textAnimatedRef.current[ti] = false
              setTextTriggered(prev => { const n = [...prev]; n[ti] = false; return n })
              setTextKeys(prev => { const n = [...prev]; n[ti]++; return n })
            }
          }
          v.play().catch(() => {})
        } else {
          v.pause()
        }
      })
    }

    // Hero text fades out as the first transition begins.
    if (textRef.current) {
      const t = 1 - layerOpacity(1, p)
      textRef.current.style.opacity = String(t)
      textRef.current.style.transform = `translateY(${(1 - t) * -24}px)`
    }

    if (scrollHintRef.current) {
      scrollHintRef.current.style.opacity = p < 0.04 ? '0.6' : '0'
    }

    rafRef.current = requestAnimationFrame(update)
  }, [count, layerOpacity])

  // A food clip finished: unlock the next clip so the page can scroll past it.
  const handleEnded = useCallback((videoIndex: number) => {
    endedRef.current.add(videoIndex)
    if (videoIndex === allowedClipRef.current) {
      allowedClipRef.current = videoIndex + 1
    }
  }, [])

  // Fires when a food clip reaches its last seconds, triggering the text badge.
  const handleTimeUpdate = useCallback((videoIndex: number) => {
    const v = videoRefs.current[videoIndex]
    if (!v || !isFinite(v.duration) || v.duration <= 0) return
    const ti = videoIndex - 1
    if (v.currentTime >= v.duration - 4 && !textAnimatedRef.current[ti]) {
      textAnimatedRef.current[ti] = true
      setTextTriggered(prev => { const n = [...prev]; n[ti] = true; return n })
    }
  }, [])

  useEffect(() => {
    // The forward gate's clamp lives in the rAF loop (see `update`). These
    // listeners only detect a *second* attempt to scroll past a held clip:
    // a fresh gesture while parked at the gate lets the user through early.
    const tryPass = () => {
      if (atGateRef.current && allowedClipRef.current < count) {
        allowedClipRef.current += 1
      }
    }
    const onTouchStart = () => tryPass()
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY <= 0) return
      const now = performance.now()
      const isNewGesture = now - lastWheelRef.current > 200
      lastWheelRef.current = now
      if (isNewGesture) tryPass()
    }

    rafRef.current = requestAnimationFrame(update)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('wheel', onWheel)
    }
  }, [update, count])

  return (
    <section
      ref={sectionRef}
      aria-label="Hero"
      style={{ height: `calc(100svh + ${count * DWELL_VH}svh)` }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* ── Stacked portrait videos ──────────────────────────────────── */}
        {VIDEOS.map((src, i) => (
          <div
            key={src}
            ref={el => { layerRefs.current[i] = el }}
            className="absolute inset-0"
            style={{ opacity: i === 0 ? 1 : 0, zIndex: i }}
            aria-hidden="true"
          >
            <video
              ref={el => { videoRefs.current[i] = el }}
              src={src}
              muted
              playsInline
              preload="auto"
              autoPlay={i === 0}
              loop={i === 0}
              onEnded={i > 0 ? () => handleEnded(i) : undefined}
              onTimeUpdate={i > 0 ? () => handleTimeUpdate(i) : undefined}
              onLoadedData={i === 0 ? markHeroReady : undefined}
              onCanPlayThrough={i === 0 ? markHeroReady : undefined}
              onError={i === 0 ? markHeroReady : undefined}
              onProgress={i === 0 ? onHeroProgress : undefined}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ))}

        {/* ── Gradient overlays for legibility ──────────────────────────── */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-brand-bg/40 via-transparent to-brand-bg/80" />

        {/* ── Text cards for clips 1–3 ──────────────────────────────────── */}
        {[0, 1, 2].map(i => (
          <div
            key={i}
            ref={el => { textOverlayRefs.current[i] = el }}
            className={`absolute z-30 pointer-events-none max-w-[80vw] ${CLIP_TEXT_POSITIONS[i]}`}
            style={{ opacity: 0, willChange: 'opacity' }}
          >
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.38)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                borderRadius: '12px',
                padding: '14px 22px',
              }}
            >
              <SplitText
                key={`pre-${textKeys[i]}`}
                text={CLIP_TEXTS[i].pre}
                tag="p"
                triggered={textTriggered[i]}
                className="font-display font-bold text-3xl text-white/90 tracking-tight leading-none"
                delay={40}
                duration={1.7}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 16 }}
                to={{ opacity: 1, y: 0 }}
                textAlign={CLIP_TEXT_ALIGNS[i]}
              />
              <SplitText
                key={`acc-${textKeys[i]}`}
                text={CLIP_TEXTS[i].accent}
                tag="p"
                triggered={textTriggered[i]}
                className="font-display font-bold text-5xl italic text-brand-accent tracking-tight leading-none"
                delay={55}
                duration={2}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 30 }}
                to={{ opacity: 1, y: 0 }}
                textAlign={CLIP_TEXT_ALIGNS[i]}
              />
            </div>
          </div>
        ))}

        {/* ── Hero text (fades out into the first transition) ───────────── */}
        <div
          ref={textRef}
          className="absolute inset-0 z-20 flex flex-col justify-end px-6 pb-20"
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

        {/* ── Scroll hint — visibility toggled directly via ref ─────────── */}
        <div
          ref={scrollHintRef}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 transition-opacity duration-300"
          style={{ opacity: 0.6 }}
        >
          <span className="label-caps text-brand-muted">Scroll</span>
          <div className="w-px h-9 bg-gradient-to-b from-brand-muted to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  )
}
