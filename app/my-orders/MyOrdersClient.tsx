'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { OrderCountdown } from '@/components/OrderCountdown'

interface OrderItem { itemNameSnapshot: string; quantity: number; unitPrice: string; lineTotal: string }
interface Order {
  id: string; orderNumber: string; orderType: string; status: string
  paymentStatus: string; subtotal: string; deliveryFee: string; total: string
  guestName: string | null; guestAddress: string | null; notes: string | null
  estimatedMinutes: number | null; readyAt: string | null
  createdAt: string; items: OrderItem[]
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  CONFIRMED: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  PREPARING: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  OUT_FOR_DELIVERY: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  COMPLETED: 'text-green-400 bg-green-400/10 border-green-400/30',
  CANCELLED: 'text-red-400 bg-red-400/10 border-red-400/30',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}

const TYPE_LABEL: Record<string, string> = {
  DELIVERY: 'Delivery', PICKUP: 'Pickup', DINE_IN: 'Dine In',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center font-body text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[status] ?? 'text-brand-muted bg-brand-surface border-brand-border'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function OrderDetail({ order }: { order: Order }) {
  const showCountdown = (order.status === 'CONFIRMED' || order.status === 'PREPARING')
    && order.readyAt && order.estimatedMinutes

  return (
    <div className="mt-4 space-y-4">
      {/* Countdown */}
      {showCountdown && (
        <div className="bg-brand-bg rounded-2xl border border-brand-border p-6 flex justify-center">
          <OrderCountdown readyAt={order.readyAt!} estimatedMinutes={order.estimatedMinutes!} />
        </div>
      )}

      {/* Items */}
      <div className="bg-brand-bg rounded-2xl border border-brand-border overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-border">
          <p className="font-body text-xs font-semibold text-brand-dim uppercase tracking-wide">Items</p>
        </div>
        <ul className="divide-y divide-brand-border">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-brand-text">{item.itemNameSnapshot}</p>
                <p className="font-body text-xs text-brand-dim mt-0.5">
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <p className="font-body text-sm font-semibold text-brand-text tabular-nums whitespace-nowrap">
                {formatPrice(item.lineTotal)}
              </p>
            </li>
          ))}
        </ul>
        {/* Price breakdown */}
        <div className="px-4 py-3 border-t border-brand-border space-y-1.5 bg-brand-surface">
          <div className="flex justify-between font-body text-sm text-brand-muted">
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          {parseFloat(order.deliveryFee) > 0 && (
            <div className="flex justify-between font-body text-sm text-brand-muted">
              <span>Delivery fee</span><span>{formatPrice(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-body text-base font-bold text-brand-text border-t border-brand-border pt-2 mt-2">
            <span>Total</span><span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery / notes info */}
      {(order.guestAddress || order.notes) && (
        <div className="bg-brand-bg rounded-2xl border border-brand-border p-4 space-y-2">
          {order.guestAddress && (
            <p className="font-body text-sm text-brand-muted flex gap-2">
              <span className="text-brand-accent flex-none">📍</span>{order.guestAddress}
            </p>
          )}
          {order.notes && (
            <p className="font-body text-sm text-brand-muted flex gap-2">
              <span className="text-brand-accent flex-none">📝</span>{order.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function MyOrdersClient({ orders }: { orders: Order[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="text-6xl block mb-5">🛒</span>
        <h2 className="font-display font-bold text-2xl text-brand-text uppercase mb-3">No Orders Yet</h2>
        <p className="font-body text-brand-muted mb-8">You haven&apos;t placed any orders. Let&apos;s change that!</p>
        <Link href="/menu"
          className="font-body font-bold text-base px-10 py-4 rounded-squoval bg-brand-accent text-brand-bg hover:bg-white transition-colors">
          Browse the Menu
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map(order => (
        <div key={order.id}
          className={`bg-brand-surface rounded-2xl border transition-colors ${expanded === order.id ? 'border-brand-accent/40' : 'border-brand-border'}`}>
          {/* Summary row — clickable */}
          <button
            onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-display font-bold text-base text-brand-accent">{order.orderNumber}</span>
                <StatusBadge status={order.status} />
                <span className="font-body text-xs text-brand-dim">
                  {TYPE_LABEL[order.orderType] ?? order.orderType}
                </span>
              </div>
              <p className="font-body text-xs text-brand-dim mt-1">
                {new Date(order.createdAt).toLocaleDateString('en-PK', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-display font-bold text-base text-brand-text">{formatPrice(order.total)}</p>
              <p className="font-body text-xs text-brand-dim mt-0.5">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
            </div>
            <span className={`font-body text-xs text-brand-dim transition-transform ${expanded === order.id ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {/* Expanded detail */}
          {expanded === order.id && (
            <div className="px-5 pb-5 border-t border-brand-border">
              <OrderDetail order={order} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
