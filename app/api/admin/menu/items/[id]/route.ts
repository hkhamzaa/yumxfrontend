import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { menuItemController } from '@/app/api/_lib/controllers/menuItemController'

/** PUT /api/admin/menu/items/[id] — Admin. Update item top-level fields. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await menuItemController.update(id, body)
  return NextResponse.json(result.data, { status: result.status })
}

/** DELETE /api/admin/menu/items/[id] — Admin. Delete item and all variants. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await menuItemController.delete(id)
  return NextResponse.json(result.data, { status: result.status })
}
