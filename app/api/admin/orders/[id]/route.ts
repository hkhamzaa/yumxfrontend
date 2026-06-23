import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { orderController } from '@/app/api/_lib/controllers/orderController'

/** GET /api/admin/orders/[id] — Admin. Full order detail with items and customer info. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await orderController.adminGetOrder(id)
  return NextResponse.json(result.data, { status: result.status })
}
