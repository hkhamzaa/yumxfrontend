import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { comboDealController } from '@/app/api/_lib/controllers/comboDealController'

/** GET /api/public/combo-deals — Public. Active combo deals ordered by displayOrder. */
export async function GET(_req: NextRequest) {
  const result = await comboDealController.getActiveDeals()
  return NextResponse.json(result.data, { status: result.status })
}
