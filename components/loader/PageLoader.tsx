'use client'

import { useEffect, useRef, useState } from 'react'
import { useLoadingStatus } from './LoadingProvider'

// Crossfade duration when lifting the loader.
const FADE_MS = 500
// Minimum on-screen time so the intro animation reads — real readiness (all hero
// frames + fonts loaded) is what actually drives dismissal now, not a timer.
const MIN_DISPLAY_MS = 600
// Stall guard: the loader waits as long as assets keep arriving (so even a slow
// phone on a weak link sees the whole hero before reveal). It only gives up if
// progress flatlines for this long — i.e. something is genuinely stuck, not slow.
const STALL_TIMEOUT_MS = 12000
// Absolute ceiling — last-resort dismiss so a hard hang can never trap the user.
// Frames keep streaming after reveal; the canvas falls back to the nearest
// loaded frame, so a late dismiss degrades gracefully rather than breaking.
const HARD_TIMEOUT_MS = 120000

export function PageLoader() {
  const { allReady, progress } = useLoadingStatus()
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  // Progress shown on the bar — monotonic, eased to 100% on dismiss.
  const [shown, setShown] = useState(0)
  const mountedAt = useRef(Date.now())
  const dismissed = useRef(false)
  // Timestamp of the last forward progress — drives the stall guard.
  const lastAdvanceAt = useRef(Date.now())
  const lastProgress  = useRef(0)

  // Skip the loader entirely on repeat visits within the session.
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('yumx_loaded')) {
      dismissed.current = true
      setVisible(false)
    }
  }, [])

  // Lock body scroll while the loader covers the viewport.
  useEffect(() => {
    if (!visible) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [visible])

  // Mirror real asset progress onto the bar (never moving backwards) and record
  // when it last moved, so the stall guard can tell "slow" from "stuck".
  useEffect(() => {
    setShown((prev) => Math.max(prev, Math.round(progress * 100)))
    if (progress > lastProgress.current) {
      lastProgress.current = progress
      lastAdvanceAt.current = Date.now()
    }
  }, [progress])

  // Dismiss when everything is ready (after a minimum on-screen time). Otherwise
  // keep waiting while assets stream in — only bail out if progress flatlines
  // (stall guard) or the absolute ceiling is hit.
  useEffect(() => {
    if (dismissed.current) return

    const dismiss = () => {
      if (dismissed.current) return
      dismissed.current = true
      setShown(100)
      setFading(true)
      setTimeout(() => {
        setVisible(false)
        try { sessionStorage.setItem('yumx_loaded', '1') } catch { /* ignore */ }
      }, FADE_MS)
    }

    if (allReady) {
      const wait = Math.max(0, MIN_DISPLAY_MS - (Date.now() - mountedAt.current))
      const ready = setTimeout(dismiss, wait)
      return () => clearTimeout(ready)
    }

    // Poll once a second: bail only if progress has been frozen too long, or the
    // hard ceiling is reached. A still-advancing download keeps the loader up.
    const poll = setInterval(() => {
      const now = Date.now()
      if (now - lastAdvanceAt.current > STALL_TIMEOUT_MS) dismiss()
      else if (now - mountedAt.current > HARD_TIMEOUT_MS) dismiss()
    }, 1000)
    return () => clearInterval(poll)
  }, [allReady])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-bg transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
      aria-label="Loading YUM X"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={shown}
    >
      {/* SVG Burger Silhouette with animated stroke */}
      <div className="relative w-40 h-40 md:w-52 md:h-52">
        <svg
          viewBox="0 0 200 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Top bun */}
          <path
            d="M 20 75 Q 100 15 180 75 L 180 85 Q 100 30 20 85 Z"
            stroke="#262626"
            strokeWidth="2"
            fill="#161616"
          />
          {/* Sesame seed dots */}
          <circle cx="80" cy="52" r="4" fill="#262626" />
          <circle cx="100" cy="44" r="4" fill="#262626" />
          <circle cx="120" cy="52" r="4" fill="#262626" />

          {/* Lettuce / veg layer */}
          <path
            d="M 15 95 Q 40 88 65 98 Q 90 108 115 95 Q 140 83 165 95 L 185 95 L 185 103 L 15 103 Z"
            fill="#262626"
            stroke="#262626"
            strokeWidth="1"
          />

          {/* Patty */}
          <rect x="12" y="108" width="176" height="24" rx="6" fill="#161616" stroke="#262626" strokeWidth="2" />

          {/* Cheese slice */}
          <path d="M 15 136 L 185 136 L 190 145 L 10 145 Z" fill="#262626" />

          {/* Bottom bun */}
          <path
            d="M 10 148 L 190 148 L 188 162 Q 100 175 12 162 Z"
            fill="#161616"
            stroke="#262626"
            strokeWidth="2"
          />

          {/* Animated outline path — the glowing traveler */}
          <path
            d="M 20 75 Q 100 15 180 75 L 185 95 Q 140 83 115 95 Q 90 108 65 98 Q 40 88 15 95 L 12 108 L 188 108 L 188 132 L 12 132 L 10 148 L 190 148 L 188 162 Q 100 175 12 162 L 10 148 L 12 108 L 15 95 L 20 85 L 20 75"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray="900"
            strokeDashoffset="900"
            className="animate-loader-dash"
            style={{ filter: 'drop-shadow(0 0 8px #F59E0B)' }}
          />
        </svg>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <span
          className="font-display text-4xl md:text-5xl font-black tracking-widest text-brand-text animate-fade-in"
          style={{ animationDelay: '0.4s', animationFillMode: 'both', opacity: 0 }}
        >
          YUM <span className="text-brand-accent">X</span>
        </span>
        <span
          className="font-body text-sm tracking-[0.25em] text-brand-muted uppercase animate-fade-in"
          style={{ animationDelay: '0.8s', animationFillMode: 'both', opacity: 0 }}
        >
          Fast Food · Lahore
        </span>
      </div>

      {/* Real asset-load progress */}
      <div className="mt-10 flex flex-col items-center gap-2">
        <div className="w-40 h-px bg-brand-border overflow-hidden">
          <div
            className="h-full bg-brand-accent"
            style={{ width: `${shown}%`, transition: 'width 200ms ease-out' }}
          />
        </div>
        <span className="font-body text-[11px] tracking-[0.25em] text-brand-dim tabular-nums">
          {shown}%
        </span>
      </div>
    </div>
  )
}
