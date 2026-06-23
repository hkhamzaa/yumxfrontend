import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { prisma } from '@/lib/prisma'

/** GET /api/admin/auth/me — Returns current admin profile from DB. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: admin.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })
    if (!user) return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: user })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
