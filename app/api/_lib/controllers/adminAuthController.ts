import { compare, hash } from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { signAdminToken } from '@/app/api/_lib/admin-auth'
import { checkRateLimit } from '@/app/api/_lib/rate-limiter'
import { createOtp, verifyAndConsumeOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/email'
import { AdminLoginSchema, ForgotPasswordSchema, VerifyResetOtpSchema } from '@/app/api/_lib/validators/admin'

// Generic 200 used for forgot-password — prevents email enumeration
const FORGOT_OK = { status: 200, data: { success: true, data: { message: 'If that email is registered, a reset code has been sent.' } } }

function serverLog(context: string, e: unknown) {
  console.error(`[adminAuthController] ${context}:`, e)
}

export const adminAuthController = {
  async login(body: unknown, ip: string) {
    const parsed = AdminLoginSchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, data: { success: false, error: 'Invalid email or password format' } }
    }

    // Rate limit: 5 attempts per 15 min per IP
    if (!checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
      return { status: 429, data: { success: false, error: 'Too many login attempts — try again in 15 minutes' } }
    }

    try {
      const { email, password } = parsed.data
      const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } })

      // Timing-safe: always run compare even if admin not found (prevents timing oracle)
      const dummyHash = '$2b$10$invalidhashforc0nst4nttimingXXXXXXXXXXXXXXXXXXXXXX'
      const valid = await compare(password, admin?.passwordHash ?? dummyHash)

      if (!admin || !valid) {
        return { status: 401, data: { success: false, error: 'Invalid email or password' } }
      }

      const token = await signAdminToken({ id: admin.id, email: admin.email, role: admin.role })

      const cookieStore = await cookies()
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 8 * 60 * 60, // 8 hours
      })

      return {
        status: 200,
        data: { success: true, data: { id: admin.id, email: admin.email, role: admin.role } },
      }
    } catch (e) {
      serverLog('login', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  async logout() {
    try {
      const cookieStore = await cookies()
      cookieStore.set('admin_token', '', { httpOnly: true, maxAge: 0, path: '/' })
      return { status: 200, data: { success: true, data: { message: 'Logged out' } } }
    } catch (e) {
      serverLog('logout', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  async forgotPassword(body: unknown, ip: string) {
    // Rate limit: 3 requests per 15 min per IP — prevents email bombing
    if (!checkRateLimit(`admin-forgot:${ip}`, 3, 15 * 60 * 1000)) {
      // Still return the generic message — don't reveal rate-limit to potential attacker
      return FORGOT_OK
    }

    const parsed = ForgotPasswordSchema.safeParse(body)
    if (!parsed.success) return FORGOT_OK

    try {
      const email = parsed.data.email.toLowerCase().trim()
      const admin = await prisma.adminUser.findUnique({ where: { email } })

      if (admin) {
        const otp = await createOtp(email, 'ADMIN')
        await sendOtpEmail(email, otp, 'admin')
      }
      // If admin not found we silently return the same message — no enumeration
    } catch (e) {
      serverLog('forgotPassword', e)
      // Still return generic OK — never reveal errors to caller
    }

    return FORGOT_OK
  },

  async verifyResetOtp(body: unknown, ip: string) {
    // Rate limit OTP verification: 5 attempts per 15 min per IP — prevents brute-force of 6-digit code
    if (!checkRateLimit(`admin-otp-verify:${ip}`, 5, 15 * 60 * 1000)) {
      return { status: 429, data: { success: false, error: 'Too many attempts — try again in 15 minutes' } }
    }

    const parsed = VerifyResetOtpSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid request'
      return { status: 400, data: { success: false, error: firstError } }
    }

    const { email, otp, newPassword } = parsed.data

    try {
      const valid = await verifyAndConsumeOtp(email, otp, 'ADMIN')
      if (!valid) {
        return { status: 400, data: { success: false, error: 'Invalid or expired code' } }
      }

      const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } })
      if (!admin) {
        // OTP was valid but no admin found — shouldn't happen in practice, fail safely
        return { status: 400, data: { success: false, error: 'Invalid or expired code' } }
      }

      const passwordHash = await hash(newPassword, 12)
      await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } })

      return { status: 200, data: { success: true, data: { message: 'Password updated. Please log in with your new password.' } } }
    } catch (e) {
      serverLog('verifyResetOtp', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  /** Utility: hash a plain password — used during admin seeding */
  hashPassword(plain: string) {
    return hash(plain, 12)
  },
}
