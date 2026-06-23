import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { adminAuthController } from '@/app/api/_lib/controllers/adminAuthController'

/** POST /api/admin/auth/login — Public. Rate-limited, timing-safe. Sets httpOnly admin_token cookie. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
  const result = await adminAuthController.login(body, ip)
  return NextResponse.json(result.data, { status: result.status })
}
