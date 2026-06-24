'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useCartStore, cartSubtotal, type CartItem } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import { UnderDevelopmentDialog } from '@/components/ui/UnderDevelopmentDialog'
import { mockSiteContent } from '@/lib/mock-data'

const ORDER_TYPES = [
  { value: 'DELIVERY' as const, label: 'Delivery', icon: '🛵' },
  { value: 'PICKUP' as const, label: 'Pickup', icon: '🏃' },
  { value: 'DINE_IN' as const, label: 'Dine In', icon: '🍽️' },
]

type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN'

interface SessionUser {
  id: string
  name: string
  email: string
  phone?: string | null
}

interface Props {
  sessionUser: SessionUser | null
}

// ─── Quantity Stepper ─────────────────────────────────────────────────────────

function QuantityStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0">
      <button
        onClick={() => onChange(value - 1)}
        className="w-10 h-10 flex items-center justify-center rounded-l-full border border-brand-border text-brand-muted hover:bg-brand-surface hover:text-brand-text transition-colors text-lg font-bold"
        aria-label="Decrease quantity"
        style={{ minWidth: 44, minHeight: 44 }}
      >
        −
      </button>
      <span className="w-10 text-center font-body text-sm font-semibold text-brand-text border-y border-brand-border h-10 flex items-center justify-center tabular-nums">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-10 h-10 flex items-center justify-center rounded-r-full border border-brand-border text-brand-muted hover:bg-brand-surface hover:text-brand-text transition-colors text-lg font-bold"
        aria-label="Increase quantity"
        style={{ minWidth: 44, minHeight: 44 }}
      >
        +
      </button>
    </div>
  )
}

// ─── Cart Item Row ────────────────────────────────────────────────────────────

function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  return (
    <div className="flex gap-3 sm:gap-4 py-4 border-b border-brand-border last:border-0">
      {/* Image */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-brand-border flex-none">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🍔</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-bold text-base sm:text-lg text-brand-text leading-tight truncate">
          {item.name}
        </h3>
        {item.variantLabel && (
          <p className="font-body text-xs text-brand-muted mt-0.5">{item.variantLabel}</p>
        )}
        <p className="font-display font-bold text-base text-brand-accent mt-1">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>

      {/* Stepper + remove */}
      <div className="flex flex-col items-end gap-2 flex-none">
        <QuantityStepper
          value={item.quantity}
          onChange={(v) => updateQuantity(item.cartKey, v)}
        />
        <button
          onClick={() => removeItem(item.cartKey)}
          className="font-body text-xs text-brand-dim hover:text-red-400 transition-colors py-1 min-h-[44px] flex items-center"
          aria-label={`Remove ${item.name}`}
        >
          Remove
        </button>
      </div>
    </div>
  )
}

// ─── Checkout Form ────────────────────────────────────────────────────────────

interface FormState {
  name: string
  phone: string
  email: string
  address: string
  notes: string
  orderType: OrderType
}

interface FieldError {
  name?: string[]
  phone?: string[]
  email?: string[]
  address?: string[]
  notes?: string[]
  items?: string[]
}

export function CartPageClient({ sessionUser }: Props) {
  const items = useCartStore((s) => s.items)
  const [mounted, setMounted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldError>({})
  const deliveryFee = parseFloat(mockSiteContent.delivery_fee) || 0
  const [maintenanceOpen, setMaintenanceOpen] = useState(false)

  const [form, setForm] = useState<FormState>({
    name: sessionUser?.name ?? '',
    phone: sessionUser?.phone ?? '',
    email: sessionUser?.email ?? '',
    address: '',
    notes: '',
    orderType: 'DELIVERY',
  })

  useEffect(() => { setMounted(true) }, [])

  // Pre-fill from session if logged in
  useEffect(() => {
    if (sessionUser) {
      setForm((f) => ({
        ...f,
        name: f.name || sessionUser.name,
        email: f.email || sessionUser.email,
        phone: f.phone || sessionUser.phone || '',
      }))
    }
  }, [sessionUser])

  const sub = cartSubtotal(items)
  const displayDeliveryFee = form.orderType === 'DELIVERY' ? deliveryFee : 0
  const displayTotal = sub + displayDeliveryFee

  function setField(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setFieldErrors((e) => ({ ...e, [key]: undefined }))
    setApiError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMaintenanceOpen(true)
  }

  // Render skeleton until hydrated (avoids cart flash)
  if (!mounted) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-brand-bg pt-16 md:pt-20 pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
            <div className="h-10 bg-brand-surface rounded w-48 animate-pulse mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-brand-surface rounded-2xl animate-pulse" />
                ))}
              </div>
              <div className="h-80 bg-brand-surface rounded-2xl animate-pulse" />
            </div>
          </div>
        </main>
      </>
    )
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-brand-bg pt-16 md:pt-20 pb-20 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="text-6xl mb-6">🛒</div>
            <h1 className="font-display font-black text-4xl text-brand-text uppercase mb-3">
              Cart&apos;s Empty
            </h1>
            <p className="font-body text-brand-muted mb-8">
              You haven&apos;t added anything yet. Head to the menu and find something you love.
            </p>
            <Link
              href="/menu"
              className="inline-block font-body font-semibold text-sm px-8 py-4 rounded-squoval bg-brand-accent text-brand-bg hover:bg-white transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg pt-16 md:pt-20 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">

          <div className="mb-6 md:mb-8">
            <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-1.5">
              Your Order
            </p>
            <h1 className="font-display font-black text-[clamp(2rem,6vw,4rem)] text-brand-text uppercase leading-[0.9] tracking-tight">
              Cart &amp; <span className="text-brand-accent">Checkout</span>
            </h1>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-10 items-start">

              {/* ── Left: Cart items + form ── */}
              <div className="space-y-6">

                {/* Cart items */}
                <section aria-labelledby="cart-items-heading" className="bg-brand-surface rounded-2xl border border-brand-border p-5 sm:p-6">
                  <h2 id="cart-items-heading" className="font-display font-bold text-xl text-brand-text mb-4 uppercase">
                    Items ({items.length})
                  </h2>
                  <div>
                    {items.map((item) => (
                      <CartItemRow key={item.cartKey} item={item} />
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-brand-border">
                    <Link
                      href="/menu"
                      className="font-body text-sm text-brand-muted hover:text-brand-accent transition-colors"
                    >
                      + Add more items
                    </Link>
                  </div>
                </section>

                {/* Order type */}
                <section aria-labelledby="order-type-heading" className="bg-brand-surface rounded-2xl border border-brand-border p-5 sm:p-6">
                  <h2 id="order-type-heading" className="font-display font-bold text-xl text-brand-text mb-4 uppercase">
                    Order Type
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
                    {ORDER_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setField('orderType', t.value)}
                        className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border transition-all duration-150 min-h-[72px] ${
                          form.orderType === t.value
                            ? 'border-brand-accent bg-brand-accent/10 text-brand-text'
                            : 'border-brand-border text-brand-muted hover:border-brand-accent/50 hover:text-brand-text'
                        }`}
                        aria-pressed={form.orderType === t.value}
                      >
                        <span className="text-xl" aria-hidden="true">{t.icon}</span>
                        <span className="font-body text-xs font-semibold">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Contact + address form */}
                <section aria-labelledby="contact-heading" className="bg-brand-surface rounded-2xl border border-brand-border p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 id="contact-heading" className="font-display font-bold text-xl text-brand-text uppercase">
                      Your Details
                    </h2>
                    {sessionUser && (
                      <span className="font-body text-xs text-green-500 font-medium">
                        ✓ Logged in
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5">
                        Full Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                        placeholder="Muhammad Ali"
                        className={`w-full bg-brand-bg border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none transition-colors min-h-[48px] ${
                          fieldErrors.name ? 'border-red-500' : 'border-brand-border focus:border-brand-accent'
                        }`}
                        autoComplete="name"
                        required
                      />
                      {fieldErrors.name && (
                        <p className="font-body text-xs text-red-400 mt-1">{fieldErrors.name[0]}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setField('phone', e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className={`w-full bg-brand-bg border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none transition-colors min-h-[48px] ${
                          fieldErrors.phone ? 'border-red-500' : 'border-brand-border focus:border-brand-accent'
                        }`}
                        autoComplete="tel"
                        required
                      />
                      {fieldErrors.phone && (
                        <p className="font-body text-xs text-red-400 mt-1">{fieldErrors.phone[0]}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5">
                        Email{' '}
                        <span className="normal-case text-brand-dim font-normal">(optional — for order tracking)</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        placeholder="ali@example.com"
                        className={`w-full bg-brand-bg border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none transition-colors min-h-[48px] ${
                          fieldErrors.email ? 'border-red-500' : 'border-brand-border focus:border-brand-accent'
                        }`}
                        autoComplete="email"
                        readOnly={!!sessionUser?.email}
                      />
                      {fieldErrors.email && (
                        <p className="font-body text-xs text-red-400 mt-1">{fieldErrors.email[0]}</p>
                      )}
                    </div>

                    {/* Address — only for DELIVERY */}
                    {form.orderType === 'DELIVERY' && (
                      <div>
                        <label htmlFor="address" className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5">
                          Delivery Address *
                        </label>
                        <textarea
                          id="address"
                          value={form.address}
                          onChange={(e) => setField('address', e.target.value)}
                          placeholder="House/Flat no., Street, Area, Lahore"
                          rows={2}
                          className={`w-full bg-brand-bg border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none transition-colors resize-none ${
                            fieldErrors.address ? 'border-red-500' : 'border-brand-border focus:border-brand-accent'
                          }`}
                          autoComplete="street-address"
                          required
                        />
                        {fieldErrors.address && (
                          <p className="font-body text-xs text-red-400 mt-1">{fieldErrors.address[0]}</p>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label htmlFor="notes" className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5">
                        Special Instructions{' '}
                        <span className="normal-case text-brand-dim font-normal">(optional)</span>
                      </label>
                      <textarea
                        id="notes"
                        value={form.notes}
                        onChange={(e) => setField('notes', e.target.value)}
                        placeholder="No onions, extra sauce, allergies, etc."
                        rows={2}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors resize-none"
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* ── Right: Order summary ── */}
              <div className="lg:sticky lg:top-28">
                <section
                  aria-labelledby="summary-heading"
                  className="bg-brand-surface rounded-2xl border border-brand-border p-5 sm:p-6"
                >
                  <h2 id="summary-heading" className="font-display font-bold text-xl text-brand-text uppercase mb-5">
                    Order Summary
                  </h2>

                  {/* Line items */}
                  <div className="space-y-2 mb-4">
                    {items.map((item) => (
                      <div key={item.cartKey} className="flex justify-between gap-4">
                        <span className="font-body text-sm text-brand-muted leading-snug flex-1">
                          {item.name}{item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.quantity}
                        </span>
                        <span className="font-body text-sm text-brand-text font-medium whitespace-nowrap tabular-nums">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-brand-border pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-brand-muted">Subtotal</span>
                      <span className="font-body text-sm text-brand-text tabular-nums">{formatPrice(sub)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-brand-muted">
                        Delivery{form.orderType !== 'DELIVERY' ? ' (N/A)' : ''}
                      </span>
                      <span className="font-body text-sm text-brand-text tabular-nums">
                        {form.orderType === 'DELIVERY' ? formatPrice(displayDeliveryFee) : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-brand-border mt-3 pt-4 flex justify-between items-baseline">
                    <span className="font-display font-bold text-xl text-brand-text uppercase">Total</span>
                    <span className="font-display font-black text-2xl text-brand-accent tabular-nums">
                      {formatPrice(displayTotal)}
                    </span>
                  </div>

                  {/* Payment note */}
                  <p className="font-body text-xs text-brand-dim mt-3 flex items-center gap-1.5">
                    <span aria-hidden="true">💵</span>
                    Cash on delivery — online payment coming soon
                  </p>

                  {/* Error message */}
                  {apiError && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <p className="font-body text-sm text-red-400">{apiError}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`mt-5 w-full font-body font-bold text-base py-4 rounded-full transition-all duration-200 min-h-[52px] ${
                      submitting
                        ? 'bg-brand-surface-high text-brand-dim cursor-not-allowed'
                        : 'bg-brand-accent text-brand-bg hover:bg-white active:scale-[0.98]'
                    }`}
                    aria-busy={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                        Placing Order…
                      </span>
                    ) : (
                      `Place Order · ${formatPrice(displayTotal)}`
                    )}
                  </button>

                  {/* Login nudge for guests */}
                  {!sessionUser && (
                    <p className="font-body text-xs text-brand-dim text-center mt-4 leading-relaxed">
                      Already have an account?{' '}
                      <Link href="/login" className="text-brand-accent hover:underline">
                        Login
                      </Link>{' '}
                      to save your order history.
                    </p>
                  )}
                </section>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer content={{}} />
      <UnderDevelopmentDialog
        label="Order Placement"
        open={maintenanceOpen}
        onOpenChange={setMaintenanceOpen}
      />
    </>
  )
}
