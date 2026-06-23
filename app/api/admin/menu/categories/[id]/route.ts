import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { menuCategoryController } from '@/app/api/_lib/controllers/menuCategoryController'

/** PUT /api/admin/menu/categories/[id] — Admin. Update category fields. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await menuCategoryController.update(id, body)
  return NextResponse.json(result.data, { status: result.status })
}

/** DELETE /api/admin/menu/categories/[id] — Admin. Delete category (blocked if has items). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await menuCategoryController.delete(id)
  return NextResponse.json(result.data, { status: result.status })
}
