'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { OrderCountdown } from '@/components/OrderCountdown'
import { formatPrice } from '@/lib/utils'

interface OrderSummary {
  id: string
  orderNumber: string
  total: string | number
  subtotal: string | number
  name: string
  orderType: string
  itemCount: number
  isLoggedIn: boolean
}

interface LiveStatus {
  status: string
  estimatedMinutes: number | null
  readyAt: string | null
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  DELIVERY: 'Delivery',
  PICKUP: 'Pickup',
  DINE_IN: 'Dine In',
}

const POLL_INTERVAL = 12_000 // 12 s

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [live, setLive] = useState<LiveStatus | null>(null)
  const [mounted, setMounted] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load sessionStorage on mount
  useEffect(() => {
    setMounted(true)
    try {
      const stored = sessionStorage.getItem(`yumx_order_${orderNumber}`)
      if (stored) {
        setSummary(JSON.parse(stored) as OrderSummary)
        sessionStorage.removeItem(`yumx_order_${orderNumber}`)
      }
    } catch { /* sessionStorage unavailable */ }
  }, [orderNumber])

  // Poll for readyAt
  async function fetchLive() {
    try {
      const res = await fetch(`/api/public/orders/status/${orderNumber}`)
      const json = await res.json() as { success: boolean; data?: LiveStatus }
      if (json.success && json.data) setLive(json.data)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchLive()
    pollRef.current = setInterval(fetchLive, POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber])

  // Stop polling once readyAt is available
  useEffect(() => {
    if (live?.readyAt && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [live?.readyAt])

  const showCountdown = live?.readyAt && live?.estimatedMinutes
  const awaitingConfirm = live && !live.readyAt && live.status === 'PENDING'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg pt-16 md:pt-20 pb-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">

          {/* Success icon */}
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl"
            style={{ background: 'rgba(245,158,11,0.12)' }}
          >
            🎉
          </div>

          <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-2">
            Order Placed
          </p>
          <h1 className="font-display font-black text-[clamp(2rem,8vw,3.5rem)] text-brand-text uppercase leading-[0.9] tracking-tight mb-2">
            You&apos;re All<br />
            <span className="text-brand-accent">Set!</span>
          </h1>

          {mounted && summary ? (
            <>
              <p className="font-body text-brand-muted mt-4 mb-6 leading-relaxed">
                Hey {summary.name.split(' ')[0]}, your order is in!
              </p>

              {/* Countdown / status block */}
              <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 mb-5">
                {showCountdown ? (
                  <OrderCountdown
                    readyAt={live.readyAt!}
                    estimatedMinutes={live.estimatedMinutes!}
                  />
                ) : awaitingConfirm ? (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <span className="w-8 h-8 border-2 border-brand-accent/40 border-t-brand-accent rounded-full animate-spin" />
                    <p className="font-body text-sm text-brand-muted leading-relaxed">
                      Your order is being reviewed —{' '}
                      <span className="text-brand-text font-medium">estimated time will appear shortly.</span>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <span className="text-3xl">⏳</span>
                    <p className="font-body text-sm text-brand-muted">Checking order status…</p>
                  </div>
                )}
              </div>

              {/* Order details card */}
              <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 text-left mb-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-body text-xs text-brand-dim uppercase tracking-wide mb-1">Order No.</p>
                    <p className="font-display font-bold text-lg text-brand-accent">{summary.orderNumber}</p>
                  </div>
                  <div>
                    <p className="font-body text-xs text-brand-dim uppercase tracking-wide mb-1">Type</p>
                    <p className="font-body text-sm font-semibold text-brand-text">
                      {ORDER_TYPE_LABELS[summary.orderType] ?? summary.orderType}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-xs text-brand-dim uppercase tracking-wide mb-1">Items</p>
                    <p className="font-body text-sm font-semibold text-brand-text">
                      {summary.itemCount} item{summary.itemCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-xs text-brand-dim uppercase tracking-wide mb-1">Total</p>
                    <p className="font-display font-bold text-lg text-brand-text">{formatPrice(summary.total)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-brand-border">
                  <p className="font-body text-xs text-brand-muted flex items-center gap-1.5">
                    <span aria-hidden="true">💵</span> Payment: Cash on delivery
                  </p>
                </div>
              </div>

              {/* Soft login prompt for guests */}
              {!summary.isLoggedIn && (
                <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 mb-5 text-left">
                  <p className="font-body text-sm text-brand-muted leading-relaxed">
                    Want to track this and future orders?{' '}
                    <Link href="/login" className="text-brand-accent font-semibold hover:underline">Login</Link>
                    {' '}or{' '}
                    <Link href="/login?mode=signup" className="text-brand-accent font-semibold hover:underline">Sign up</Link>
                    {' '}— free and takes 10 seconds.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="font-body text-brand-muted mt-4 mb-6 leading-relaxed">
              Your order <strong className="text-brand-accent font-display">{orderNumber}</strong> has been placed.
              We&apos;ll start preparing it right away.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {summary?.isLoggedIn && (
              <Link href="/my-orders"
                className="font-body font-semibold text-sm px-8 py-4 rounded-full border border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-accent transition-colors">
                My Orders
              </Link>
            )}
            <Link href="/menu"
              className="font-body font-semibold text-sm px-8 py-4 rounded-squoval bg-brand-accent text-brand-bg hover:bg-white transition-colors">
              Order More
            </Link>
            <Link href="/"
              className="font-body font-semibold text-sm px-8 py-4 rounded-full border border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-accent transition-colors">
              Home
            </Link>
          </div>
        </div>
      </main>
      <Footer content={{}} />
    </>
  )
}
