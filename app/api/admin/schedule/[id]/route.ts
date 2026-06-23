import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { scheduleController } from '@/app/api/_lib/controllers/scheduleController'

/** PUT /api/admin/schedule/[id] — Admin. Update a day's hours or isClosed flag. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await scheduleController.updateDay(id, body)
  return NextResponse.json(result.data, { status: result.status })
}

/** DELETE /api/admin/schedule/[id] — Admin. Remove schedule entry (prefer isClosed=true). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await scheduleController.deleteDay(id)
  return NextResponse.json(result.data, { status: result.status })
}
