import { Prisma } from '@prisma/client'
import { prisma, type Tx } from '@/lib/prisma'
import { CreateOrderSchema, type CreateOrderInput } from '@/app/api/_lib/validators/order'
import { verifyCustomerSession } from '@/app/api/_lib/customer-auth'
import type { NextRequest } from 'next/server'

function serverLog(ctx: string, e: unknown) {
  console.error(`[orderController] ${ctx}:`, e)
}

/** Atomic order counter via SiteContent._order_seq — race-condition safe via Postgres upsert */
async function generateOrderNumber(tx: Tx): Promise<string> {
  const rows = await tx.$queryRaw<Array<{ seq: bigint }>>`
    INSERT INTO site_content (id, key, value, updated_at)
    VALUES (gen_random_uuid()::text, '_order_seq', '1000', NOW())
    ON CONFLICT (key) DO UPDATE
      SET value  = (CAST(site_content.value AS BIGINT) + 1)::TEXT,
          updated_at = NOW()
    RETURNING CAST(value AS BIGINT) AS seq
  `
  return `YX-${String(Number(rows[0].seq)).padStart(4, '0')}`
}

/** Safe subset of order fields returned to guest tracking */
const TRACK_SELECT = {
  id: true, orderNumber: true, orderType: true, status: true,
  paymentStatus: true, subtotal: true, deliveryFee: true, total: true,
  createdAt: true, updatedAt: true,
  items: { select: { itemNameSnapshot: true, quantity: true, unitPrice: true, lineTotal: true } },
}

export const orderController = {
  /** POST /api/public/orders — guest or authenticated checkout */
  async createOrder(body: unknown, req: NextRequest) {
    const parsed = CreateOrderSchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    }

    const session = await verifyCustomerSession(req)
    const { orderType, guestName, guestPhone, guestEmail, guestAddress, notes, items } = parsed.data

    try {
      // 1. Validate + price all items (using CURRENT DB prices — never trust client)
      type LineItem = {
        menuItemVariantId: string | null
        comboDealId: string | null
        itemNameSnapshot: string
        quantity: number
        unitPrice: Prisma.Decimal
        lineTotal: Prisma.Decimal
      }

      const lineItems: LineItem[] = await Promise.all(
        items.map(async item => {
          if (item.menuItemVariantId) {
            const variant = await prisma.menuItemVariant.findUnique({
              where: { id: item.menuItemVariantId },
              include: { menuItem: { select: { name: true, isAvailable: true } } },
            })
            if (!variant || !variant.menuItem.isAvailable) {
              throw Object.assign(new Error('unavailable'), { status: 422, field: item.menuItemVariantId })
            }
            return {
              menuItemVariantId: item.menuItemVariantId,
              comboDealId: null,
              itemNameSnapshot: `${variant.menuItem.name} (${variant.label})`,
              quantity: item.quantity,
              unitPrice: variant.price,
              lineTotal: variant.price.mul(item.quantity),
            }
          } else {
            const deal = await prisma.comboDeal.findUnique({ where: { id: item.comboDealId! } })
            if (!deal || !deal.isActive) {
              throw Object.assign(new Error('unavailable'), { status: 422, field: item.comboDealId })
            }
            return {
              menuItemVariantId: null,
              comboDealId: item.comboDealId!,
              itemNameSnapshot: deal.title,
              quantity: item.quantity,
              unitPrice: deal.price,
              lineTotal: deal.price.mul(item.quantity),
            }
          }
        }),
      )

      // 2. Server-side price computation
      const subtotal = lineItems.reduce((acc, li) => acc.add(li.lineTotal), new Prisma.Decimal(0))

      let deliveryFeeNum = 0
      if (orderType === 'DELIVERY') {
        const feeRow = await prisma.siteContent.findUnique({ where: { key: 'delivery_fee' } })
        if (feeRow?.value) {
          const parsed = parseFloat(feeRow.value)
          if (!isNaN(parsed) && parsed >= 0) {
            deliveryFeeNum = parsed
          } else {
            console.warn(`[orderController] delivery_fee "${feeRow.value}" is not a valid number, using 0`)
          }
        } else {
          console.warn('[orderController] delivery_fee not found in SiteContent, using 0')
        }
      }
      const deliveryFee = new Prisma.Decimal(deliveryFeeNum)
      const total = subtotal.add(deliveryFee)

      // 3. Create order + items atomically
      const order = await prisma.$transaction(async tx => {
        const orderNumber = await generateOrderNumber(tx)
        return tx.order.create({
          data: {
            orderNumber,
            customerId: session?.id ?? null,
            guestName: guestName ?? null,
            guestPhone: guestPhone ?? null,
            guestEmail: guestEmail ?? null,
            guestAddress: guestAddress ?? null,
            orderType,
            notes: notes ?? null,
            status: 'PENDING',
            paymentMethod: 'CASH',
            paymentStatus: 'UNPAID',
            subtotal,
            deliveryFee,
            total,
            items: { create: lineItems },
          },
          include: { items: true },
        })
      })

      return { status: 201, data: { success: true, data: order } }
    } catch (e: unknown) {
      const typed = e as { status?: number }
      if (typed?.status === 422) {
        return { status: 422, data: { success: false, error: 'One or more items are no longer available' } }
      }
      serverLog('createOrder', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  /** GET /api/public/orders/track — orderNumber + phone must BOTH match */
  async trackGuestOrder(orderNumber: string, phone: string) {
    try {
      const order = await prisma.order.findFirst({
        where: { orderNumber, guestPhone: phone },
        select: TRACK_SELECT,
      })
      // Return identical 404 whether order doesn't exist OR phone doesn't match (no oracle)
      if (!order) return { status: 404, data: { success: false, error: 'Order not found' } }
      return { status: 200, data: { success: true, data: order } }
    } catch (e) {
      serverLog('trackGuestOrder', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  /** GET /api/customer/orders — includes guest orders backfilled by email */
  async getCustomerOrders(customerId: string, customerEmail: string) {
    try {
      const orders = await prisma.order.findMany({
        where: { OR: [{ customerId }, { guestEmail: customerEmail }] },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      })
      return { status: 200, data: { success: true, data: orders } }
    } catch (e) {
      serverLog('getCustomerOrders', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  /** GET /api/customer/orders/[id] — IDOR: must own the order */
  async getCustomerOrderById(orderId: string, customerId: string, customerEmail: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      })
      // Return same 404 whether not found or not owned (no leak)
      if (!order) return { status: 404, data: { success: false, error: 'Order not found' } }
      const owns = order.customerId === customerId || order.guestEmail === customerEmail
      if (!owns) return { status: 404, data: { success: false, error: 'Order not found' } }
      return { status: 200, data: { success: true, data: order } }
    } catch (e) {
      serverLog('getCustomerOrderById', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  /** GET /api/admin/orders — filterable list */
  async adminListOrders(req: NextRequest) {
    try {
      const sp = req.nextUrl.searchParams
      const status = sp.get('status') as 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED' | null
      const orderType = sp.get('orderType') as 'DELIVERY' | 'PICKUP' | 'DINE_IN' | null
      const from = sp.get('from')
      const to = sp.get('to')
      const page = Math.max(1, parseInt(sp.get('page') ?? '1'))
      const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20')))

      const where: Prisma.OrderWhereInput = {}
      if (status) where.status = status
      if (orderType) where.orderType = orderType
      if (from || to) {
        where.createdAt = {}
        if (from) where.createdAt.gte = new Date(from)
        if (to) where.createdAt.lte = new Date(to + 'T23:59:59Z')
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where, orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit, take: limit,
          include: { items: true, customer: { select: { name: true, email: true, phone: true } } },
        }),
        prisma.order.count({ where }),
      ])

      return { status: 200, data: { success: true, data: { orders, total, page, limit } } }
    } catch (e) {
      serverLog('adminListOrders', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  async adminGetOrder(id: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true, customer: true },
      })
      if (!order) return { status: 404, data: { success: false, error: 'Order not found' } }
      return { status: 200, data: { success: true, data: order } }
    } catch (e) {
      serverLog('adminGetOrder', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  async updateStatus(id: string, body: unknown) {
    const validStatuses = ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'] as const
    const b = body as Record<string, unknown>
    const status = b?.status
    if (!validStatuses.includes(status as typeof validStatuses[number])) {
      return { status: 400, data: { success: false, error: `status must be one of: ${validStatuses.join(', ')}` } }
    }

    // When confirming, estimatedMinutes is required and readyAt is computed server-side
    if (status === 'CONFIRMED') {
      const mins = Number(b?.estimatedMinutes)
      if (!Number.isInteger(mins) || mins < 1 || mins > 300) {
        return { status: 400, data: { success: false, error: 'estimatedMinutes must be a whole number between 1 and 300' } }
      }
      try {
        const readyAt = new Date(Date.now() + mins * 60 * 1000)
        const order = await prisma.order.update({
          where: { id },
          data: { status: 'CONFIRMED', estimatedMinutes: mins, readyAt },
        })
        return { status: 200, data: { success: true, data: order } }
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
          return { status: 404, data: { success: false, error: 'Order not found' } }
        }
        serverLog('updateStatus/confirm', e)
        return { status: 500, data: { success: false, error: 'Internal server error' } }
      }
    }

    try {
      const order = await prisma.order.update({ where: { id }, data: { status: status as typeof validStatuses[number] } })
      return { status: 200, data: { success: true, data: order } }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return { status: 404, data: { success: false, error: 'Order not found' } }
      }
      serverLog('updateStatus', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  async updatePaymentStatus(id: string, body: unknown) {
    const ps = (body as Record<string, unknown>)?.paymentStatus
    if (ps !== 'PAID' && ps !== 'UNPAID') {
      return { status: 400, data: { success: false, error: 'paymentStatus must be PAID or UNPAID' } }
    }
    try {
      const order = await prisma.order.update({ where: { id }, data: { paymentStatus: ps } })
      return { status: 200, data: { success: true, data: order } }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return { status: 404, data: { success: false, error: 'Order not found' } }
      }
      serverLog('updatePaymentStatus', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },
}
