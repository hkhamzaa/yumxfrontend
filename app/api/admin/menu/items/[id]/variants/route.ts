import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { menuItemVariantController } from '@/app/api/_lib/controllers/menuItemVariantController'

/** GET /api/admin/menu/items/[id]/variants — Admin. List all variants for item. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await menuItemVariantController.list(id)
  return NextResponse.json(result.data, { status: result.status })
}

/** POST /api/admin/menu/items/[id]/variants — Admin. Add a new variant to item. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await menuItemVariantController.create(id, body)
  return NextResponse.json(result.data, { status: result.status })
}
