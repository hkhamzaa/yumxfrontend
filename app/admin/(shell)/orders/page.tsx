'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { RefreshCw, ChevronRight, Bell, BellOff, Clock } from 'lucide-react'
import { OrderStatusBadge, PaymentBadge, Badge, Select, Button, Spinner, EmptyState, Card, Modal } from '@/components/admin/ui'

interface OrderItem { itemNameSnapshot: string; quantity: number; lineTotal: string | number }
interface Order {
  id: string; orderNumber: string; orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN'
  status: string; paymentStatus: string; total: string | number
  guestName: string | null; guestPhone: string | null
  customer: { name: string; phone: string | null } | null
  createdAt: string; items: OrderItem[]
  estimatedMinutes: number | null
}
interface OrdersResponse { orders: Order[]; total: number; page: number; limit: number }

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' }, { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PREPARING', label: 'Preparing' }, { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'COMPLETED', label: 'Completed' }, { value: 'CANCELLED', label: 'Cancelled' },
]
const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'DELIVERY', label: 'Delivery' }, { value: 'PICKUP', label: 'Pickup' }, { value: 'DINE_IN', label: 'Dine In' },
]
const UPDATE_STATUS_OPTIONS = [
  { value: 'CONFIRMED', label: 'Confirmed' }, { value: 'PREPARING', label: 'Preparing' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'COMPLETED', label: 'Completed' }, { value: 'CANCELLED', label: 'Cancelled' },
]
const TYPE_LABELS: Record<string, string> = { DELIVERY: 'Delivery', PICKUP: 'Pickup', DINE_IN: 'Dine In' }

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
  } catch { /* AudioContext may be unavailable */ }
}

// ── Estimated-time modal shown when confirming an order ───────────────────────

function ConfirmOrderModal({ open, onClose, onConfirm, loading }: {
  open: boolean; onClose: () => void
  onConfirm: (mins: number) => void; loading: boolean
}) {
  const [mins, setMins] = useState('25')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { if (open) { setMins('25'); setErr(null) } }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(mins)
    if (!Number.isInteger(n) || n < 1 || n > 300) { setErr('Enter a time between 1 and 300 minutes'); return }
    onConfirm(n)
  }

  return (
    <Modal open={open} onClose={onClose} title="Confirm Order" width="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 bg-brand-bg rounded-xl p-4 border border-brand-border">
          <Clock size={20} className="text-brand-accent flex-shrink-0" />
          <p className="font-body text-sm text-brand-muted leading-relaxed">
            How long until this order is ready?<br />
            The customer will see a live countdown timer.
          </p>
        </div>
        <div>
          <label className="font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5">
            Estimated Ready Time
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number" min={1} max={300} value={mins}
              onChange={e => { setMins(e.target.value); setErr(null) }}
              className="w-24 bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 font-body text-sm text-brand-text text-center focus:outline-none focus:border-brand-accent transition-colors"
              autoFocus
            />
            <span className="font-body text-sm text-brand-muted">minutes</span>
          </div>
          {/* Quick picks */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[15, 20, 25, 30, 45].map(n => (
              <button key={n} type="button" onClick={() => setMins(String(n))}
                className={`font-body text-xs px-3 py-1.5 rounded-full border transition-colors ${mins === String(n) ? 'bg-brand-accent border-brand-accent text-brand-bg' : 'border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-accent'}`}>
                {n} min
              </button>
            ))}
          </div>
        </div>
        {err && <p className="font-body text-xs text-red-400">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" loading={loading}>Confirm Order</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [notificationsOn, setNotificationsOn] = useState(false)

  // Confirm modal state
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null) // orderId
  const [confirmLoading, setConfirmLoading] = useState(false)

  const prevPendingRef = useRef<number>(-1)
  const limit = 20

  const fetchOrders = useCallback(async (isPolling = false) => {
    const sp = new URLSearchParams()
    if (statusFilter) sp.set('status', statusFilter)
    if (typeFilter) sp.set('orderType', typeFilter)
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    sp.set('page', String(page))
    sp.set('limit', String(limit))

    try {
      const res = await fetch(`/api/admin/orders?${sp}`)
      const json = (await res.json()) as { success: boolean; data: OrdersResponse }
      if (!json.success) return
      setOrders(json.data.orders)
      setTotal(json.data.total)
      setLastRefresh(new Date())

      const currentPending = json.data.orders.filter(o => o.status === 'PENDING').length
      if (isPolling && prevPendingRef.current >= 0 && currentPending > prevPendingRef.current) {
        playBeep()
        if (notificationsOn && Notification.permission === 'granted') {
          new Notification('YUM X — New Order!', {
            body: `${currentPending - prevPendingRef.current} new order(s) received.`,
          })
        }
      }
      prevPendingRef.current = currentPending
    } catch { /* ignore network errors during poll */ } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter, from, to, page, notificationsOn])

  useEffect(() => { setLoading(true); fetchOrders(false) }, [fetchOrders])
  useEffect(() => {
    const id = setInterval(() => fetchOrders(true), 10_000)
    return () => clearInterval(id)
  }, [fetchOrders])

  // Called from the status <select> — intercepts CONFIRMED to show modal
  function handleStatusChange(orderId: string, status: string) {
    if (status === 'CONFIRMED') {
      setConfirmTarget(orderId)
    } else {
      updateStatus(orderId, status)
    }
  }

  async function updateStatus(orderId: string, status: string, extraBody?: Record<string, unknown>) {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extraBody }),
    })
    fetchOrders(false)
  }

  async function handleConfirmWithTime(mins: number) {
    if (!confirmTarget) return
    setConfirmLoading(true)
    await updateStatus(confirmTarget, 'CONFIRMED', { estimatedMinutes: mins })
    setConfirmLoading(false)
    setConfirmTarget(null)
  }

  async function togglePayment(order: Order) {
    const next = order.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID'
    await fetch(`/api/admin/orders/${order.id}/payment-status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: next }),
    })
    fetchOrders(false)
  }

  async function requestNotifications() {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    if (perm === 'granted') setNotificationsOn(true)
  }

  const totalPages = Math.ceil(total / limit)
  const customerName = (o: Order) => o.customer?.name ?? o.guestName ?? '—'

  const StatusSelect = ({ order }: { order: Order }) => (
    <select
      defaultValue=""
      onChange={e => { if (e.target.value) { handleStatusChange(order.id, e.target.value); e.target.value = '' } }}
      className="bg-brand-bg border border-brand-border rounded-lg px-2 py-1 font-body text-xs text-brand-muted focus:outline-none focus:border-brand-accent"
    >
      <option value="" disabled>Update</option>
      {UPDATE_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Confirm-time modal */}
      <ConfirmOrderModal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmWithTime}
        loading={confirmLoading}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-2xl text-brand-text uppercase">Orders</h1>
          <p className="font-body text-xs text-brand-dim mt-0.5">
            {total} total · {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => notificationsOn ? setNotificationsOn(false) : requestNotifications()}
            title={notificationsOn ? 'Disable browser notifications' : 'Enable browser notifications'}
            className={`p-2 rounded-lg border transition-colors ${notificationsOn ? 'border-brand-accent text-brand-accent' : 'border-brand-border text-brand-dim hover:text-brand-text'}`}
          >
            {notificationsOn ? <Bell size={15} /> : <BellOff size={15} />}
          </button>
          <button onClick={() => fetchOrders(false)} className="flex items-center gap-1.5 font-body text-xs text-brand-muted hover:text-brand-accent transition-colors border border-brand-border px-3 py-2 rounded-lg">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select options={STATUS_OPTIONS} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} />
          <Select options={TYPE_OPTIONS} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} />
          <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }}
            className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 font-body text-sm text-brand-text focus:outline-none focus:border-brand-accent transition-colors min-h-[38px]" />
          <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }}
            className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 font-body text-sm text-brand-text focus:outline-none focus:border-brand-accent transition-colors min-h-[38px]" />
        </div>
      </Card>

      {/* Table / Cards */}
      {loading && orders.length === 0 ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-brand-accent" /></div>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders found" description="Try adjusting the filters." />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-border text-left">
                    {['Order', 'Customer', 'Type', 'Status', 'Payment', 'Total', 'Time', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 font-body text-xs font-semibold text-brand-dim uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {orders.map(order => (
                    <tr key={order.id} className={`hover:bg-brand-bg/40 transition-colors ${order.status === 'PENDING' ? 'bg-amber-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-display font-bold text-sm text-brand-accent hover:underline">
                          {order.orderNumber}
                        </Link>
                        {order.status === 'PENDING' && <span className="ml-2 inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse" />}
                        {order.estimatedMinutes && (
                          <span className="ml-2 font-body text-[10px] text-brand-dim">~{order.estimatedMinutes}m</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-brand-text">{customerName(order)}</td>
                      <td className="px-4 py-3">
                        <Badge color={order.orderType === 'DELIVERY' ? 'blue' : order.orderType === 'PICKUP' ? 'purple' : 'gray'}>
                          {TYPE_LABELS[order.orderType]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => togglePayment(order)}><PaymentBadge status={order.paymentStatus} /></button>
                      </td>
                      <td className="px-4 py-3 font-body text-sm font-semibold text-brand-text tabular-nums">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3 font-body text-xs text-brand-dim whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusSelect order={order} />
                          <Link href={`/admin/orders/${order.id}`} className="text-brand-dim hover:text-brand-accent transition-colors">
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map(order => (
              <Card key={order.id} className={`p-4 ${order.status === 'PENDING' ? 'border-amber-500/30' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link href={`/admin/orders/${order.id}`} className="font-display font-bold text-base text-brand-accent">
                      {order.orderNumber}
                    </Link>
                    {order.status === 'PENDING' && <span className="ml-2 inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse" />}
                    <p className="font-body text-sm text-brand-muted mt-0.5">{customerName(order)}</p>
                    {order.estimatedMinutes && (
                      <p className="font-body text-xs text-brand-dim mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> ~{order.estimatedMinutes} min
                      </p>
                    )}
                  </div>
                  <span className="font-display font-bold text-base text-brand-text">{formatPrice(order.total)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <OrderStatusBadge status={order.status} />
                  <button onClick={() => togglePayment(order)}><PaymentBadge status={order.paymentStatus} /></button>
                  <Badge color={order.orderType === 'DELIVERY' ? 'blue' : order.orderType === 'PICKUP' ? 'purple' : 'gray'}>
                    {TYPE_LABELS[order.orderType]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs text-brand-dim">
                    {new Date(order.createdAt).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusSelect order={order} />
                    <Link href={`/admin/orders/${order.id}`} className="text-brand-dim hover:text-brand-accent">
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
              <span className="font-body text-sm text-brand-muted">Page {page} of {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
