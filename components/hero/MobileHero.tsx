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

const DWELL_VH = 50
const FADE     = 0.4

// Lerp scales with scroll velocity so the scrub feels 1:1 during a fast fling
// and silky-settling when the finger lifts.
//   vel (px/ms)  lerp
//   0            0.055  → gentle glide to rest
//   1            ~0.22  → smooth follow
//   3            ~0.53  → near-direct
//   5+           0.65   → capped, feels instant
const LERP_BASE  = 0.055
const LERP_SCALE = 0.12
const LERP_CAP   = 0.65

// Only seek when the target differs by ≥ 1 frame at 30 fps.
const SEEK_THR = 1 / 30

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

/**
 * Mobile hero: portrait videos scrubbed by scroll.
 *
 * Zero-jank architecture:
 *  • Section geometry cached once (mount + resize) — never queried inside rAF.
 *  • Passive scroll listener writes scrollY + measures velocity into refs —
 *    the rAF loop reads refs only, no DOM queries.
 *  • Adaptive lerp: lerp = LERP_BASE + velocity * LERP_SCALE, capped at LERP_CAP.
 *    Fast scroll → near-direct; stopped → silky glide to rest.
 *  • Velocity decays per-frame (×0.88) to approximate momentum deceleration.
 *  • Off-screen layers (opacity < 0.01 and not in crossfade) are skipped entirely —
 *    no decoder wakeup for invisible clips.
 *  • `translateZ(0)` on every video + layer forces independent GPU compositor
 *    layers; opacity changes never touch the main thread.
 */
export function MobileHero() {
  const sectionRef      = useRef<HTMLElement>(null)
  const videoRefs       = useRef<(HTMLVideoElement | null)[]>([])
  const layerRefs       = useRef<(HTMLDivElement | null)[]>([])
  const textOverlayRefs = useRef<(HTMLDivElement | null)[]>([])
  const textRef         = useRef<HTMLDivElement>(null)
  const scrollHintRef   = useRef<HTMLDivElement>(null)
  const rafRef          = useRef<number>(0)

  // Section geometry — written on mount + resize, never inside rAF
  const sectionTopRef = useRef(0)
  const denomRef      = useRef(1)

  // Scroll state — written by passive listener, read by rAF (zero layout force)
  const targetPRef  = useRef(0)          // raw scroll → progress [0,1]
  const smoothPRef  = useRef(0)          // lerped display progress
  const velRef      = useRef(0)          // |px/ms|, drives adaptive lerp
  const prevScrollY = useRef(0)
  const prevScrollT = useRef(performance.now())

  const textAnimatedRef = useRef([false, false, false])
  const [textTriggered, setTextTriggered] = useState([false, false, false])
  const [textKeys,      setTextKeys]      = useState([0, 0, 0])

  const count = VIDEOS.length

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
    } catch {}
  }, [reportProgress])

  // Catch already-buffered first clip
  useEffect(() => {
    const v = videoRefs.current[0]
    if (v && v.readyState >= 2) markHeroReady()
  }, [markHeroReady])

  // Keep every video paused — currentTime is fully scroll-driven
  useEffect(() => {
    videoRefs.current.forEach(v => { if (v) v.pause() })
  }, [])

  // ── Section geometry (mount + resize) ────────────────────────────────────────
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

  // ── Passive scroll listener — velocity + progress, zero DOM reads in rAF ─────
  useEffect(() => {
    const onScroll = () => {
      const now  = performance.now()
      const dt   = now - prevScrollT.current
      if (dt > 0) {
        velRef.current = Math.abs((window.scrollY - prevScrollY.current) / dt)
      }
      prevScrollY.current = window.scrollY
      prevScrollT.current = now
      targetPRef.current  = clamp01((window.scrollY - sectionTopRef.current) / denomRef.current)
    }
    // Seed before first rAF fires
    prevScrollY.current = window.scrollY
    prevScrollT.current = performance.now()
    targetPRef.current  = clamp01((window.scrollY - sectionTopRef.current) / denomRef.current)

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Opacity of clip i at scroll progress p ────────────────────────────────────
  const layerOpacity = useCallback((i: number, p: number) => {
    if (i === 0) return 1
    const seg      = 1 / count
    const boundary = i * seg
    const halfFade = (seg * FADE) / 2
    return smoothstep((p - (boundary - halfFade)) / (halfFade * 2))
  }, [count])

  // ── rAF loop — zero DOM reads, pure ref reads + style writes ─────────────────
  const update = useCallback(() => {
    // Adaptive lerp: scales with velocity so fast scroll ≈ direct, stopped = silky
    const lerp = Math.min(LERP_CAP, LERP_BASE + velRef.current * LERP_SCALE)
    smoothPRef.current += (targetPRef.current - smoothPRef.current) * lerp

    // Velocity decays each frame to approximate momentum deceleration
    velRef.current *= 0.88

    const p   = smoothPRef.current
    const seg = 1 / count

    // ── Scrub video currentTime ───────────────────────────────────────────────
    for (let i = 0; i < count; i++) {
      const v = videoRefs.current[i]
      if (!v || !isFinite(v.duration) || v.duration <= 0) continue

      // Skip off-screen layers that aren't in a crossfade transition
      const op  = layerOpacity(i, p)
      const nOp = i + 1 < count ? layerOpacity(i + 1, p) : 0
      const inCrossfade = op > 0.01 || nOp > 0.01 || i === 0
      if (!inCrossfade) continue

      const t      = clamp01((p - i * seg) / seg)
      const target = t * v.duration
      if (Math.abs(v.currentTime - target) > SEEK_THR) {
        v.currentTime = target
      }
    }

    // ── Layer opacities ───────────────────────────────────────────────────────
    for (let i = 0; i < count; i++) {
      const layer = layerRefs.current[i]
      if (layer) layer.style.opacity = String(layerOpacity(i, p))
    }

    // ── Text badge visibility ─────────────────────────────────────────────────
    for (let i = 0; i < 3; i++) {
      const overlay = textOverlayRefs.current[i]
      if (overlay) {
        const fadeIn  = layerOpacity(i + 1, p)
        const fadeOut = i + 2 < count ? layerOpacity(i + 2, p) : 0
        overlay.style.opacity = textAnimatedRef.current[i]
          ? String(fadeIn * (1 - fadeOut))
          : '0'
      }

      const progressInClip = clamp01((p - (i + 1) * seg) / seg)
      if (progressInClip >= 0.75 && !textAnimatedRef.current[i]) {
        textAnimatedRef.current[i] = true
        setTextTriggered(prev => { const n = [...prev]; n[i] = true; return n })
      } else if (progressInClip < 0.45 && textAnimatedRef.current[i]) {
        textAnimatedRef.current[i] = false
        setTextTriggered(prev => { const n = [...prev]; n[i] = false; return n })
        setTextKeys(prev => { const n = [...prev]; n[i]++; return n })
      }
    }

    // ── Hero text fade ────────────────────────────────────────────────────────
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
      {/* sticky viewport */}
      <div className="sticky top-0 h-[100svh] overflow-hidden">

        {/* ── Stacked portrait videos ─────────────────────────────────────── */}
        {VIDEOS.map((src, i) => (
          <div
            key={src}
            ref={el => { layerRefs.current[i] = el }}
            className="absolute inset-0"
            style={{
              opacity:    i === 0 ? 1 : 0,
              zIndex:     i,
              willChange: 'opacity',
              // translateZ promotes to its own GPU compositor layer so opacity
              // changes never touch the main thread
              transform:  'translateZ(0)',
            }}
            aria-hidden="true"
          >
            <video
              ref={el => { videoRefs.current[i] = el }}
              src={src}
              muted
              playsInline
              preload="auto"
              onLoadedData={i === 0 ? markHeroReady    : undefined}
              onCanPlayThrough={i === 0 ? markHeroReady : undefined}
              onError={i === 0 ? markHeroReady          : undefined}
              onProgress={i === 0 ? onHeroProgress      : undefined}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'translateZ(0)' }}
            />
          </div>
        ))}

        {/* ── Gradient veil ────────────────────────────────────────────────── */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-brand-bg/40 via-transparent to-brand-bg/80" />

        {/* ── Text badges for clips 1–3 ────────────────────────────────────── */}
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

        {/* ── Hero text — fades into first transition ──────────────────────── */}
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

        {/* ── Scroll hint ──────────────────────────────────────────────────── */}
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
