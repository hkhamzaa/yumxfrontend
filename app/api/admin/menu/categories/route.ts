import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { menuCategoryController } from '@/app/api/_lib/controllers/menuCategoryController'

/** GET /api/admin/menu/categories — Admin. All categories with item counts. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await menuCategoryController.adminList()
  return NextResponse.json(result.data, { status: result.status })
}

/** POST /api/admin/menu/categories — Admin. Create category; auto-generates slug. */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await menuCategoryController.create(body)
  return NextResponse.json(result.data, { status: result.status })
}
