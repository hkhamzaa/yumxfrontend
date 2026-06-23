import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { orderController } from '@/app/api/_lib/controllers/orderController'

/** POST /api/public/orders — Public (session optional). Guest or authenticated checkout. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const result = await orderController.createOrder(body, req)
  return NextResponse.json(result.data, { status: result.status })
}
