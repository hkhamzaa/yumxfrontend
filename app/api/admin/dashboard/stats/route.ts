import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/app/api/_lib/admin-auth'
import { dashboardController } from '@/app/api/_lib/controllers/dashboardController'

/** GET /api/admin/dashboard/stats — Admin. Aggregate dashboard metrics. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const result = await dashboardController.getStats()
  return NextResponse.json(result.data, { status: result.status })
}
