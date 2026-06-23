import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { siteContentController } from '@/app/api/_lib/controllers/siteContentController'

/** GET /api/admin/site-content — Admin. All SiteContent rows. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await siteContentController.adminListAll()
  return NextResponse.json(result.data, { status: result.status })
}

/** POST /api/admin/site-content — Admin. Upsert by key (idempotent). Body: { key, value }. */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await siteContentController.upsertByKey(body)
  return NextResponse.json(result.data, { status: result.status })
}
