import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { menuItemVariantController } from '@/app/api/_lib/controllers/menuItemVariantController'

/** PUT /api/admin/menu/items/[id]/variants/[variantId] — Admin. Update variant label or price. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const { id, variantId } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await menuItemVariantController.update(variantId, body)
  return NextResponse.json(result.data, { status: result.status })
}

/** DELETE /api/admin/menu/items/[id]/variants/[variantId] — Admin. Delete variant (blocked if last). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const { id, variantId } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await menuItemVariantController.delete(id, variantId)
  return NextResponse.json(result.data, { status: result.status })
}
