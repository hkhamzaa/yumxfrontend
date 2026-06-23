import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { comboDealController } from '@/app/api/_lib/controllers/comboDealController'

/** GET /api/admin/combo-deals — Admin. All combo deals including inactive. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await comboDealController.adminList()
  return NextResponse.json(result.data, { status: result.status })
}

/** POST /api/admin/combo-deals — Admin. Create combo deal. */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await comboDealController.create(body)
  return NextResponse.json(result.data, { status: result.status })
}
