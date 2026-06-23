import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { testimonialController } from '@/app/api/_lib/controllers/testimonialController'

/** GET /api/admin/testimonials — Admin. All testimonials including inactive. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await testimonialController.adminList()
  return NextResponse.json(result.data, { status: result.status })
}

/** POST /api/admin/testimonials — Admin. Create testimonial. */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await testimonialController.create(body)
  return NextResponse.json(result.data, { status: result.status })
}
