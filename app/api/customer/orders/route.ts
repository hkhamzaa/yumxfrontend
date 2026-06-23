import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyCustomerSession } from '@/app/api/_lib/customer-auth'
import { orderController } from '@/app/api/_lib/controllers/orderController'

/** GET /api/customer/orders — Authenticated. Customer order history including backfilled guest orders. */
export async function GET(req: NextRequest) {
  const customer = await verifyCustomerSession(req)
  if (!customer) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await orderController.getCustomerOrders(customer.id, customer.email)
  return NextResponse.json(result.data, { status: result.status })
}
