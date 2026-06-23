'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MyOrdersClient } from './MyOrdersClient'
import { MaintenancePageView } from '@/components/ui/MaintenancePageView'

interface OrderItem { itemNameSnapshot: string; quantity: number; unitPrice: string; lineTotal: string }
interface Order {
  id: string; orderNumber: string; orderType: string; status: string
  paymentStatus: string; subtotal: string; deliveryFee: string; total: string
  guestName: string | null; guestAddress: string | null; notes: string | null
  estimatedMinutes: number | null; readyAt: string | null
  createdAt: string; items: OrderItem[]
}

export default function MyOrdersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id) {
      router.replace('/login?callbackUrl=/my-orders')
      return
    }

    fetch('/api/customer/orders')
      .then((res) => {
        if (res.status === 401) {
          router.replace('/login?callbackUrl=/my-orders')
          return null
        }
        if (!res.ok) throw new Error('Failed to load orders')
        return res.json()
      })
      .then((json) => {
        if (!json) return
        const raw = json.success ? json.data : []
        const serialised = (raw as Order[]).map((order) => ({
          ...order,
          subtotal: String(order.subtotal),
          deliveryFee: String(order.deliveryFee),
          total: String(order.total),
          readyAt: order.readyAt ? String(order.readyAt) : null,
          createdAt: String(order.createdAt),
          items: order.items.map((item) => ({
            ...item,
            unitPrice: String(item.unitPrice),
            lineTotal: String(item.lineTotal),
          })),
        }))
        setOrders(serialised)
      })
      .catch(() => setError(true))
  }, [session, status, router])

  if (error) return <MaintenancePageView label="My Orders" />

  if (status === 'loading' || !session?.user?.id || orders === null) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="font-body text-brand-muted">Loading your orders…</p>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg pt-16 md:pt-20 pb-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto pt-10">
          <p className="font-body text-xs tracking-[0.3em] text-brand-accent uppercase font-semibold mb-2">
            Account
          </p>
          <h1 className="font-display font-black text-[clamp(2rem,6vw,3.5rem)] text-brand-text uppercase leading-[0.9] tracking-tight mb-10">
            My <span className="text-brand-accent">Orders</span>
          </h1>
          <MyOrdersClient orders={orders} />
        </div>
      </main>
      <Footer content={{}} />
    </>
  )
}
