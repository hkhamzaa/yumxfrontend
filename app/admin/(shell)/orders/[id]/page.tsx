'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { ChevronLeft, Phone, Mail, MapPin, StickyNote } from 'lucide-react'
import { OrderStatusBadge, PaymentBadge, Badge, Button, Spinner, Select, Card } from '@/components/admin/ui'

interface OrderItem {
  id: string; itemNameSnapshot: string; quantity: number
  unitPrice: string | number; lineTotal: string | number
}
interface OrderDetail {
  id: string; orderNumber: string; orderType: string; status: string
  paymentStatus: string; paymentMethod: string
  subtotal: string | number; deliveryFee: string | number; total: string | number
  guestName: string | null; guestPhone: string | null; guestEmail: string | null; guestAddress: string | null
  notes: string | null; createdAt: string; updatedAt: string
  customer: { name: string; email: string | null; phone: string } | null
  items: OrderItem[]
}

const UPDATE_STATUS_OPTIONS = [
  { value: 'CONFIRMED', label: 'Confirmed' }, { value: 'PREPARING', label: 'Preparing' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'COMPLETED', label: 'Completed' }, { value: 'CANCELLED', label: 'Cancelled' },
]
const TYPE_LABELS: Record<string, string> = { DELIVERY: 'Delivery', PICKUP: 'Pickup', DINE_IN: 'Dine In' }

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusValue, setStatusValue] = useState('')
  const [updating, setUpdating] = useState(false)

  async function fetchOrder() {
    const res = await fetch(`/api/admin/orders/${id}`)
    const json = (await res.json()) as { success: boolean; data: OrderDetail }
    if (json.success) { setOrder(json.data); setStatusValue(json.data.status) }
    setLoading(false)
  }

  useEffect(() => { fetchOrder() }, [id])

  async function applyStatus() {
    if (!statusValue || statusValue === order?.status) return
    setUpdating(true)
    await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusValue }),
    })
    await fetchOrder()
    setUpdating(false)
  }

  async function togglePayment() {
    if (!order) return
    const next = order.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID'
    await fetch(`/api/admin/orders/${id}/payment-status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: next }),
    })
    await fetchOrder()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} className="text-brand-accent" /></div>
  if (!order) return (
    <div className="text-center py-20">
      <p className="font-body text-brand-muted mb-4">Order not found.</p>
      <Link href="/admin/orders" className="font-body text-sm text-brand-accent hover:underline">← Back to orders</Link>
    </div>
  )

  const name = order.customer?.name ?? order.guestName
  const phone = order.customer?.phone ?? order.guestPhone
  const email = order.customer?.email ?? order.guestEmail

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/orders')} className="text-brand-dim hover:text-brand-text transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="font-display font-black text-2xl text-brand-text uppercase">{order.orderNumber}</h1>
          <p className="font-body text-xs text-brand-dim mt-0.5">
            {new Date(order.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      </div>

      {/* Status + Payment */}
      <Card className="p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <button onClick={togglePayment}><PaymentBadge status={order.paymentStatus} /></button>
          <Badge color={order.orderType === 'DELIVERY' ? 'blue' : order.orderType === 'PICKUP' ? 'purple' : 'gray'}>
            {TYPE_LABELS[order.orderType] ?? order.orderType}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={UPDATE_STATUS_OPTIONS}
            value={statusValue}
            onChange={e => setStatusValue(e.target.value)}
            className="text-xs min-h-[34px] !py-1"
          />
          <Button size="sm" onClick={applyStatus} loading={updating} disabled={statusValue === order.status}>
            Update
          </Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Customer info */}
        <Card className="p-4 space-y-3">
          <h2 className="font-display font-bold text-sm text-brand-text uppercase mb-2">Customer</h2>
          {name && <p className="font-body text-sm text-brand-text font-semibold">{name}</p>}
          {phone && <p className="flex items-center gap-2 font-body text-sm text-brand-muted"><Phone size={13} />{phone}</p>}
          {email && <p className="flex items-center gap-2 font-body text-sm text-brand-muted"><Mail size={13} />{email}</p>}
          {order.guestAddress && (
            <p className="flex items-start gap-2 font-body text-sm text-brand-muted"><MapPin size={13} className="mt-0.5 flex-shrink-0" />{order.guestAddress}</p>
          )}
          {order.notes && (
            <p className="flex items-start gap-2 font-body text-sm text-brand-muted italic"><StickyNote size={13} className="mt-0.5 flex-shrink-0" />{order.notes}</p>
          )}
        </Card>

        {/* Price breakdown */}
        <Card className="p-4">
          <h2 className="font-display font-bold text-sm text-brand-text uppercase mb-3">Payment</h2>
          <div className="space-y-2 font-body text-sm">
            <div className="flex justify-between text-brand-muted">
              <span>Subtotal</span><span className="tabular-nums">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-brand-muted">
              <span>Delivery fee</span><span className="tabular-nums">{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-brand-text font-bold pt-2 border-t border-brand-border">
              <span>Total</span><span className="tabular-nums text-brand-accent">{formatPrice(order.total)}</span>
            </div>
            <div className="flex justify-between text-brand-muted pt-1">
              <span>Payment method</span><span>{order.paymentMethod}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Items */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-border">
          <h2 className="font-display font-bold text-sm text-brand-text uppercase">Items ({order.items.length})</h2>
        </div>
        <div className="divide-y divide-brand-border">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-body text-sm text-brand-text">{item.itemNameSnapshot}</p>
                <p className="font-body text-xs text-brand-dim">{formatPrice(item.unitPrice)} × {item.quantity}</p>
              </div>
              <span className="font-body text-sm font-semibold text-brand-text tabular-nums">{formatPrice(item.lineTotal)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
