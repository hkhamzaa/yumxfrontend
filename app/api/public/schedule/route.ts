import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { scheduleController } from '@/app/api/_lib/controllers/scheduleController'

/** GET /api/public/schedule — Public. Weekly operating hours (all 7 days). */
export async function GET(_req: NextRequest) {
  const result = await scheduleController.getPublicSchedule()
  return NextResponse.json(result.data, { status: result.status })
}
