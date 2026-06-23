import { prisma } from '@/lib/prisma'

function serverLog(ctx: string, e: unknown) {
  console.error(`[dashboardController] ${ctx}:`, e)
}

export const dashboardController = {
  async getStats() {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 7)

      const [
        ordersToday,
        revenueToday,
        pendingOrders,
        activeOrders,
        topItems,
      ] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
        prisma.order.aggregate({
          where: {
            createdAt: { gte: todayStart, lte: todayEnd },
            status: { not: 'CANCELLED' },
          },
          _sum: { total: true },
        }),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: { in: ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'] } } }),
        prisma.orderItem.groupBy({
          by: ['itemNameSnapshot'],
          where: { order: { createdAt: { gte: weekStart }, status: { not: 'CANCELLED' } } },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),
      ])

      return {
        status: 200,
        data: {
          success: true,
          data: {
            ordersToday,
            revenueToday: revenueToday._sum.total ?? 0,
            pendingOrders,
            activeOrders,
            topItemsThisWeek: topItems.map(i => ({
              name: i.itemNameSnapshot,
              totalQuantity: i._sum.quantity ?? 0,
            })),
          },
        },
      }
    } catch (e) {
      serverLog('getStats', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },
}
