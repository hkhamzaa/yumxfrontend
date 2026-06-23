import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { comboDealController } from '@/app/api/_lib/controllers/comboDealController'

/** PUT /api/admin/combo-deals/[id] — Admin. Update combo deal fields. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await comboDealController.update(id, body)
  return NextResponse.json(result.data, { status: result.status })
}

/** DELETE /api/admin/combo-deals/[id] — Admin. Delete combo deal. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await comboDealController.delete(id)
  return NextResponse.json(result.data, { status: result.status })
}
