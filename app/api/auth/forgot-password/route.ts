import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/app/api/_lib/rate-limiter'
import { createOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/email'
import { CustomerForgotPasswordSchema } from '@/app/api/_lib/validators/auth'

// Always return this — prevents email enumeration regardless of outcome
const OK = { success: true, data: { message: 'If that email is registered, a reset code has been sent.' } }

/** POST /api/auth/forgot-password — Public. Enumeration-safe. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown'

  // Rate limit: 3 requests per 15 min per IP — prevents email bombing
  if (!checkRateLimit(`customer-forgot:${ip}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json(OK, { status: 200 })
  }

  const body = await req.json().catch(() => null)
  const parsed = CustomerForgotPasswordSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(OK, { status: 200 })

  try {
    const email = parsed.data.email.toLowerCase().trim()

    // Only proceed for customers with a passwordHash (Google-only accounts have no password to reset)
    const customer = await prisma.customer.findUnique({ where: { email } })
    if (customer?.passwordHash) {
      const otp = await createOtp(email, 'CUSTOMER')
      await sendOtpEmail(email, otp, 'customer')
    }
    // If no customer, or Google-only customer — same generic response, no information leaked
  } catch (e) {
    console.error('[/api/auth/forgot-password]', e)
  }

  return NextResponse.json(OK, { status: 200 })
}
