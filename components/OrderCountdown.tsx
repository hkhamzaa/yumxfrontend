'use client'

import { useEffect, useState } from 'react'

interface Props {
  readyAt: string | Date  // ISO string or Date
  estimatedMinutes: number
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

export function OrderCountdown({ readyAt, estimatedMinutes }: Props) {
  const endMs = new Date(readyAt).getTime()
  const totalMs = estimatedMinutes * 60 * 1000

  const [remaining, setRemaining] = useState(() => Math.max(0, endMs - Date.now()))

  useEffect(() => {
    if (remaining === 0) return
    const id = setInterval(() => {
      const r = Math.max(0, endMs - Date.now())
      setRemaining(r)
    }, 1000)
    return () => clearInterval(id)
  }, [endMs, remaining])

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  const done = remaining === 0

  // SVG progress ring
  const RADIUS = 54
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const progress = done ? 1 : 1 - remaining / totalMs
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring */}
      <div className="relative w-40 h-40">
        <svg width="160" height="160" viewBox="0 0 120 120" className="-rotate-90" aria-hidden="true">
          {/* Track */}
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#262626" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="60" cy="60" r={RADIUS} fill="none"
            stroke={done ? '#22c55e' : '#F59E0B'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s' }}
          />
        </svg>
        {/* Time display centred in ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done ? (
            <span className="text-3xl" aria-label="Ready">✓</span>
          ) : (
            <>
              <span className="font-display font-black text-3xl text-brand-text leading-none tabular-nums">
                {pad(mins)}:{pad(secs)}
              </span>
              <span className="font-body text-[10px] text-brand-dim tracking-widest uppercase mt-1">mins left</span>
            </>
          )}
        </div>
      </div>

      {/* Status text */}
      {done ? (
        <div className="text-center">
          <p className="font-display font-bold text-xl text-green-400 uppercase">Ready Now!</p>
          <p className="font-body text-sm text-brand-muted mt-1">Your order should be ready — head over to pick up!</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="font-body text-sm text-brand-muted">
            Estimated ready in{' '}
            <span className="font-semibold text-brand-text">{mins} min{mins !== 1 ? 's' : ''}</span>
          </p>
        </div>
      )}
    </div>
  )
}
