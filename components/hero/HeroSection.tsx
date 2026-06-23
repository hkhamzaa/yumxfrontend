'use client'

import { useEffect, useState } from 'react'
import { DesktopHero } from './DesktopHero'
import { MobileHero } from './MobileHero'

/**
 * Picks the hero experience by breakpoint:
 *   • Desktop (≥1024px) → frame-scrubbed canvas hero (yam_x_hero.mp4)
 *   • Mobile  (<1024px) → scroll-driven portrait video sequence
 *
 * matchMedia is client-only, so we render nothing until the breakpoint is known
 * (one tick after mount — invisible behind the page loader). This guarantees only
 * ONE hero ever mounts, so we never download both the desktop frames and the
 * mobile videos, and the loader has a single, well-defined hero to wait on.
 */
export function HeroSection() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (isDesktop === null) return null

  return isDesktop ? <DesktopHero /> : <MobileHero />
}
