'use client'

import { useState } from 'react'
import { Wrench } from 'lucide-react'
import { Dialog, DialogContent, DialogClose } from './dialog'

interface Props {
  /** Optional label shown above the title (e.g. "Login / Sign Up") */
  label?: string
  // ── Trigger mode ───────────────────────────────────────────────────────────
  /** Button text / elements that act as the trigger. Renders a button when set. */
  children?: React.ReactNode
  triggerClassName?: string
  // ── Controlled mode ────────────────────────────────────────────────────────
  /** When provided the caller controls open state; no trigger button is rendered. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function UnderDevelopmentDialog({
  label,
  children,
  triggerClassName,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [localOpen, setLocalOpen] = useState(false)

  const isControlled = controlledOpen !== undefined
  const dialogOpen = isControlled ? controlledOpen! : localOpen

  function handleOpenChange(v: boolean) {
    if (isControlled) onOpenChange?.(v)
    else setLocalOpen(v)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {/* Only render a trigger button in trigger mode */}
      {children !== undefined && (
        <button
          type="button"
          onClick={() => handleOpenChange(true)}
          className={triggerClassName}
        >
          {children}
        </button>
      )}

      <DialogContent showDragHandle>
        {/* Close */}
        <DialogClose
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-brand-muted hover:text-brand-accent hover:bg-white/5 transition-all"
          aria-label="Close dialog"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </DialogClose>

        {/* Icon badge */}
        <div className="flex justify-center mt-2 mb-6">
          <div className="w-20 h-20 rounded-full bg-brand-accent/10 flex items-center justify-center ring-1 ring-brand-accent/30 shadow-[0_0_30px_rgba(245,158,11,0.18)]">
            <Wrench size={34} className="text-brand-accent" strokeWidth={1.5} />
          </div>
        </div>

        {/* Body */}
        <div className="text-center px-2">
          {label && (
            <p className="font-body text-[10px] font-bold uppercase tracking-widest text-brand-accent mb-2">
              {label}
            </p>
          )}

          <h2 className="font-display font-black text-2xl text-brand-text mb-3">
            Under Development
          </h2>

          <div className="w-10 h-0.5 bg-brand-accent/60 mx-auto mb-5 rounded-full" />

          <p className="font-body text-sm text-brand-muted leading-relaxed mb-8">
            This feature is still being crafted. We&apos;re working hard to bring you the best experience — check back soon!
          </p>

          <DialogClose asChild>
            <button
              type="button"
              className="w-full font-body text-sm font-bold py-3 px-6 rounded-squoval bg-brand-accent text-brand-bg hover:bg-white hover:text-brand-bg transition-all duration-200"
            >
              Got it
            </button>
          </DialogClose>
        </div>

        {/* Credit */}
        <div className="mt-6 pt-5 border-t border-brand-border/50 text-center">
          <p className="font-body text-xs text-brand-dim">
            Developed by{' '}
            <span className="text-brand-accent font-semibold tracking-wider">Contour Systems</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
