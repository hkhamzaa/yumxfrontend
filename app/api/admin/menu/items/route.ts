import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { menuItemController } from '@/app/api/_lib/controllers/menuItemController'

/** GET /api/admin/menu/items — Admin. Paginated list (?categoryId=&page=&limit=). */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await menuItemController.adminList(req)
  return NextResponse.json(result.data, { status: result.status })
}

/** POST /api/admin/menu/items — Admin. Create item with at least one variant. */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await menuItemController.create(body)
  return NextResponse.json(result.data, { status: result.status })
}
