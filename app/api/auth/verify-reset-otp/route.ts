import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/app/api/_lib/rate-limiter'
import { verifyAndConsumeOtp } from '@/lib/otp'
import { CustomerVerifyResetOtpSchema } from '@/app/api/_lib/validators/auth'

/** POST /api/auth/verify-reset-otp — Public. Validates OTP and updates customer password. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown'

  // Rate limit OTP verification: 5 attempts per 15 min per IP — prevents brute-force of 6-digit code
  if (!checkRateLimit(`customer-otp-verify:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: 'Too many attempts — try again in 15 minutes' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = CustomerVerifyResetOtpSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid request'
    return NextResponse.json({ success: false, error: firstError }, { status: 400 })
  }

  const { email, otp, newPassword } = parsed.data

  try {
    const valid = await verifyAndConsumeOtp(email, otp, 'CUSTOMER')
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Invalid or expired code' }, { status: 400 })
    }

    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Invalid or expired code' }, { status: 400 })
    }

    const passwordHash = await hash(newPassword, 12)
    await prisma.customer.update({ where: { id: customer.id }, data: { passwordHash } })

    return NextResponse.json({
      success: true,
      data: { message: 'Password updated. Please sign in with your new password.' },
    })
  } catch (e) {
    console.error('[/api/auth/verify-reset-otp]', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
