import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { scheduleController } from '@/app/api/_lib/controllers/scheduleController'

/** GET /api/admin/schedule — Admin. All 7 schedule rows. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await scheduleController.adminGetSchedule()
  return NextResponse.json(result.data, { status: result.status })
}

/** POST /api/admin/schedule — Admin. Upsert schedule entry by dayOfWeek. */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await scheduleController.upsertDay(body)
  return NextResponse.json(result.data, { status: result.status })
}
