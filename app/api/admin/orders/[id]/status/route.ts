import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { orderController } from '@/app/api/_lib/controllers/orderController'

/** PATCH /api/admin/orders/[id]/status — Admin. Update order status. Body: { status }. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await orderController.updateStatus(id, body)
  return NextResponse.json(result.data, { status: result.status })
}
