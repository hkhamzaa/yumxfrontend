'use client'

import * as RadixDialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

export const Dialog = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger
export const DialogClose = RadixDialog.Close

export function DialogOverlay({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>) {
  return (
    <RadixDialog.Overlay
      className={cn(
        // Heavy blur + deep dim per Noir & Nectar overlay spec
        'fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl',
        'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in',
        className
      )}
      {...props}
    />
  )
}

export function DialogContent({
  className,
  children,
  showDragHandle = true,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & { showDragHandle?: boolean }) {
  return (
    <RadixDialog.Portal>
      <DialogOverlay />
      <RadixDialog.Content
        className={cn(
          // Mobile: bottom sheet — no border (ring below replaces it)
          'fixed z-[201] w-full bottom-0 left-0 right-0 bg-brand-surface rounded-t-2xl p-6',
          // Desktop: centered modal
          'md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:rounded-2xl',
          // Height safety: never taller than viewport, always scrollable if content overflows
          'max-h-[92dvh] overflow-y-auto',
          // Glowing amber border — ring for the 1px line, shadow for the halo
          'ring-1 ring-brand-accent/40 shadow-[0_0_40px_rgba(245,158,11,0.20)]',
          'focus:outline-none',
          'data-[state=open]:animate-fade-in',
          className
        )}
        {...props}
      >
        {showDragHandle && (
          <div className="md:hidden mx-auto mb-4 w-10 h-1 rounded-full bg-brand-border" aria-hidden="true" />
        )}
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

export function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixDialog.Title>) {
  return (
    <RadixDialog.Title
      className={cn('font-display font-bold text-2xl text-brand-text mb-1', className)}
      {...props}
    />
  )
}

export function DialogDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixDialog.Description>) {
  return (
    <RadixDialog.Description
      className={cn('font-body text-sm text-brand-muted mb-4', className)}
      {...props}
    />
  )
}
