import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { orderController } from '@/app/api/_lib/controllers/orderController'

/** GET /api/public/orders/track?orderNumber=YX-1001&phone=03001234567 — Public. */
export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get('orderNumber')
  const phone = req.nextUrl.searchParams.get('phone')
  if (!orderNumber || !phone) {
    return NextResponse.json(
      { success: false, error: 'Missing required query params: orderNumber, phone' },
      { status: 400 },
    )
  }
  const result = await orderController.trackGuestOrder(orderNumber, phone)
  return NextResponse.json(result.data, { status: result.status })
}
