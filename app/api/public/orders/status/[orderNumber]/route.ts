import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/public/orders/status/[orderNumber]
 * Returns only the non-sensitive status fields needed for the customer countdown.
 * No auth required — order number is the access token here.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { status: true, estimatedMinutes: true, readyAt: true },
    })
    if (!order) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: order })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
