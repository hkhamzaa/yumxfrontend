'use client'

import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { ShoppingBag, DollarSign, Clock, Zap, TrendingUp, RefreshCw } from 'lucide-react'
import { Spinner, Card } from '@/components/admin/ui'

interface Stats {
  ordersToday: number
  revenueToday: number | string
  pendingOrders: number
  activeOrders: number
  topItemsThisWeek: { name: string; totalQuantity: number }[]
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${accent ? 'bg-brand-accent/15 text-brand-accent' : 'bg-brand-border text-brand-muted'}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="font-body text-xs text-brand-dim uppercase tracking-wide mb-0.5">{label}</p>
        <p className="font-display font-bold text-2xl text-brand-text leading-none">{value}</p>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/dashboard/stats')
      const json = (await res.json()) as { success: boolean; data: Stats }
      if (json.success) {
        setStats(json.data)
        setLastRefresh(new Date())
        setError(null)
      } else {
        setError('Failed to load stats')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const id = setInterval(fetchStats, 30_000)
    return () => clearInterval(id)
  }, [])

  const maxQty = stats?.topItemsThisWeek.reduce((m, i) => Math.max(m, i.totalQuantity), 0) ?? 1

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-brand-text uppercase">Dashboard</h1>
          {lastRefresh && (
            <p className="font-body text-xs text-brand-dim mt-0.5">
              Updated {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => { setLoading(true); fetchStats() }}
          className="flex items-center gap-1.5 font-body text-xs text-brand-muted hover:text-brand-accent transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="font-body text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading && !stats ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} className="text-brand-accent" />
        </div>
      ) : stats ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ShoppingBag} label="Orders Today" value={String(stats.ordersToday)} />
            <StatCard icon={DollarSign} label="Revenue Today" value={formatPrice(stats.revenueToday)} accent />
            <StatCard icon={Clock} label="Pending Orders" value={String(stats.pendingOrders)} />
            <StatCard icon={Zap} label="Active Orders" value={String(stats.activeOrders)} />
          </div>

          {/* Top items this week */}
          {stats.topItemsThisWeek.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={16} className="text-brand-accent" />
                <h2 className="font-display font-bold text-base text-brand-text uppercase">Top Items This Week</h2>
              </div>
              <div className="space-y-3">
                {stats.topItemsThisWeek.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="font-display font-bold text-sm text-brand-dim w-5 text-right flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-body text-sm text-brand-text truncate">{item.name}</span>
                        <span className="font-body text-xs font-semibold text-brand-muted ml-2 flex-shrink-0">
                          {item.totalQuantity} sold
                        </span>
                      </div>
                      <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-accent rounded-full transition-all duration-500"
                          style={{ width: `${(item.totalQuantity / maxQty) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}
