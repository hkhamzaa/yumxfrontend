import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { adminAuthController } from '@/app/api/_lib/controllers/adminAuthController'

/** POST /api/admin/auth/logout — Clears admin_token cookie (no auth required). */
export async function POST(_req: NextRequest) {
  const result = await adminAuthController.logout()
  return NextResponse.json(result.data, { status: result.status })
}
