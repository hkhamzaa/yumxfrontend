import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { galleryController } from '@/app/api/_lib/controllers/galleryController'

/** GET /api/admin/gallery — Admin. All gallery images including inactive. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await galleryController.adminListImages()
  return NextResponse.json(result.data, { status: result.status })
}

/** POST /api/admin/gallery — Admin. Add gallery image record. */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const result = await galleryController.createImage(body)
  return NextResponse.json(result.data, { status: result.status })
}
