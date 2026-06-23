'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

// ─── Button ──────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type BtnSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
  loading?: boolean
}

const btnBase = 'inline-flex items-center justify-center gap-1.5 font-body font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 disabled:opacity-50 disabled:cursor-not-allowed'
const btnVariants: Record<BtnVariant, string> = {
  primary:   'bg-brand-accent text-brand-bg hover:bg-white active:scale-[0.98]',
  secondary: 'bg-brand-surface border border-brand-border text-brand-text hover:border-brand-accent/50',
  danger:    'bg-red-600/10 border border-red-500/30 text-red-400 hover:bg-red-600/20',
  ghost:     'text-brand-muted hover:text-brand-text hover:bg-brand-surface',
}
const btnSizes: Record<BtnSize, string> = {
  sm: 'text-xs px-2.5 py-1.5 min-h-[30px]',
  md: 'text-sm px-3.5 py-2 min-h-[36px]',
  lg: 'text-sm px-5 py-2.5 min-h-[42px]',
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(btnBase, btnVariants[variant], btnSizes[size], className)}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-block rounded-full border-2 border-current/20 border-t-current animate-spin', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full bg-brand-bg border rounded-lg px-3 py-2 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none transition-colors min-h-[38px]',
          error ? 'border-red-500' : 'border-brand-border focus:border-brand-accent',
          className
        )}
        {...props}
      />
      {error && <p className="font-body text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Textarea ────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'w-full bg-brand-bg border rounded-lg px-3 py-2 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none transition-colors resize-none',
          error ? 'border-red-500' : 'border-brand-border focus:border-brand-accent',
          className
        )}
        {...props}
      />
      {error && <p className="font-body text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full bg-brand-bg border rounded-lg px-3 py-2 font-body text-sm text-brand-text focus:outline-none transition-colors min-h-[38px] cursor-pointer',
          error ? 'border-red-500' : 'border-brand-border focus:border-brand-accent',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="font-body text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/50',
          checked ? 'bg-brand-accent' : 'bg-brand-border'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
      {label && <span className="font-body text-sm text-brand-muted">{label}</span>}
    </label>
  )
}

// ─── Badge ───────────────────────────────────────────────────────────────────

type BadgeColor = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'orange' | 'gray'

const badgeColors: Record<BadgeColor, string> = {
  green:  'bg-green-500/10 text-green-400 border-green-500/20',
  amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  red:    'bg-red-500/10 text-red-400 border-red-500/20',
  blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  gray:   'bg-brand-surface text-brand-muted border-brand-border',
}

export function Badge({ children, color = 'gray', className }: { children: React.ReactNode; color?: BadgeColor; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-body border', badgeColors[color], className)}>
      {children}
    </span>
  )
}

// ─── Status badge helpers ─────────────────────────────────────────────────────

export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: BadgeColor }> = {
    PENDING:          { label: 'Pending',         color: 'amber'  },
    CONFIRMED:        { label: 'Confirmed',        color: 'blue'   },
    PREPARING:        { label: 'Preparing',        color: 'orange' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'purple' },
    COMPLETED:        { label: 'Completed',        color: 'green'  },
    CANCELLED:        { label: 'Cancelled',        color: 'red'    },
  }
  const m = map[status] ?? { label: status, color: 'gray' as BadgeColor }
  return <Badge color={m.color}>{m.label}</Badge>
}

export function PaymentBadge({ status }: { status: string }) {
  return <Badge color={status === 'PAID' ? 'green' : 'amber'}>{status === 'PAID' ? 'Paid' : 'Unpaid'}</Badge>
}

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: string
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className={cn('relative w-full bg-brand-surface border border-brand-border rounded-2xl shadow-2xl', width)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h2 className="font-display font-bold text-lg text-brand-text uppercase">{title}</h2>
          <button onClick={onClose} className="text-brand-dim hover:text-brand-text transition-colors p-1 -mr-1">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

export function ConfirmModal({ open, onClose, onConfirm, title, message, loading }: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="font-body text-sm text-brand-muted mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>Delete</Button>
      </div>
    </Modal>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-4xl mb-3 text-brand-dim">{icon}</div>}
      <p className="font-body font-semibold text-brand-muted mb-1">{title}</p>
      {description && <p className="font-body text-sm text-brand-dim mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-brand-surface border border-brand-border rounded-xl', className)}>
      {children}
    </div>
  )
}

// ─── Star rating (read-only) ──────────────────────────────────────────────────

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="font-body text-sm text-amber-400">
      {'★'.repeat(Math.min(5, Math.max(1, rating)))}{'☆'.repeat(5 - Math.min(5, Math.max(1, rating)))}
    </span>
  )
}
