import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { orderController } from '@/app/api/_lib/controllers/orderController'

/** GET /api/admin/orders — Admin. Filterable, paginated order list. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await orderController.adminListOrders(req)
  return NextResponse.json(result.data, { status: result.status })
}
