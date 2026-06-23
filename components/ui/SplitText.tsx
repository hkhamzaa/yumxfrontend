'use client'

import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { SplitText as GSAPSplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(GSAPSplitText, useGSAP)

interface SplitTextProps {
  text: string
  className?: string
  delay?: number
  duration?: number
  ease?: string
  splitType?: string
  from?: Record<string, unknown>
  to?: Record<string, unknown>
  textAlign?: string
  tag?: string
  triggered?: boolean
  onLetterAnimationComplete?: () => void
}

export default function SplitText({
  text,
  className = '',
  delay = 50,
  duration = 2.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  textAlign = 'center',
  tag = 'p',
  triggered = false,
  onLetterAnimationComplete,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null)
  const animationCompletedRef = useRef(false)
  const onCompleteRef = useRef(onLetterAnimationComplete)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete
  }, [onLetterAnimationComplete])

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true)
    } else {
      document.fonts.ready.then(() => setFontsLoaded(true))
    }
  }, [])

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded || !triggered) return
      if (animationCompletedRef.current) return

      const el = ref.current

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elAny = el as any
      if (elAny._rbsplitInstance) {
        try { elAny._rbsplitInstance.revert() } catch (_) { /* noop */ }
        elAny._rbsplitInstance = null
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let targets: any[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assignTargets = (self: any) => {
        if (splitType.includes('chars') && self.chars?.length) targets = self.chars
        if (!targets && splitType.includes('words') && self.words?.length) targets = self.words
        if (!targets && splitType.includes('lines') && self.lines?.length) targets = self.lines
        if (!targets) targets = self.chars || self.words || self.lines
      }

      const splitInstance = new GSAPSplitText(el, {
        type: splitType,
        smartWrap: true,
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        reduceWhiteSpace: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSplit: (self: any) => {
          assignTargets(self)
          return gsap.fromTo(targets, { ...from }, {
            ...to,
            duration,
            ease,
            stagger: delay / 1000,
            onComplete: () => {
              animationCompletedRef.current = true
              onCompleteRef.current?.()
            },
            willChange: 'transform, opacity',
            force3D: true,
          })
        },
      })

      elAny._rbsplitInstance = splitInstance

      return () => {
        try { splitInstance.revert() } catch (_) { /* noop */ }
        elAny._rbsplitInstance = null
      }
    },
    {
      dependencies: [
        text, delay, duration, ease, splitType,
        JSON.stringify(from), JSON.stringify(to),
        triggered, fontsLoaded,
      ],
      scope: ref,
    }
  )

  // Cast to 'p' to keep JSX happy — callers control the actual tag via the prop
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = (tag || 'p') as any

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      style={{
        textAlign: textAlign as React.CSSProperties['textAlign'],
        overflow: 'hidden',
        display: 'inline-block',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        willChange: 'transform, opacity',
      }}
      className={`split-parent ${className}`}
    >
      {text}
    </Tag>
  )
}
