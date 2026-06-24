'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
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

const ORDER_TYPE_LABELS: Record<string, string> = {
  DELIVERY: 'Delivery',
  PICKUP: 'Pickup',
  DINE_IN: 'Dine In',
}

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [mounted, setMounted] = useState(false)

  // Load order summary from sessionStorage (set by CartPageClient on submit)
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

              <div className="bg-brand-surface rounded-2xl border border-brand-border p-4 mb-5">
                <p className="font-body text-sm text-brand-muted flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-brand-accent/40 border-t-brand-accent rounded-full animate-spin flex-none" />
                  We&apos;re preparing your order — our team will be in touch shortly.
                </p>
              </div>
            </>
          ) : (
            <p className="font-body text-brand-muted mt-4 mb-6 leading-relaxed">
              Your order <strong className="text-brand-accent font-display">{orderNumber}</strong> has been placed.
              We&apos;ll start preparing it right away.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
