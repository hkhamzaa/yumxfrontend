import { prisma } from './prisma'

const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes

export function generateOtp(): string {
  // Cryptographically adequate for a short-lived 6-digit OTP
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** Invalidate any live OTPs for this email+type, then create a fresh one. Returns the plain OTP. */
export async function createOtp(
  email: string,
  userType: 'ADMIN' | 'CUSTOMER',
): Promise<string> {
  const normalised = email.toLowerCase().trim()

  // Expire any previous unused OTPs so only one live token exists at a time
  await prisma.passwordResetOtp.updateMany({
    where: { email: normalised, userType, used: false },
    data: { used: true },
  })

  const otp = generateOtp()
  await prisma.passwordResetOtp.create({
    data: {
      email: normalised,
      otpCode: otp,
      userType,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  })

  return otp
}

/**
 * Verify and immediately consume an OTP.
 * Returns { valid: true } on success, { valid: false } on any failure.
 * The OTP is marked used before this function returns — single-use guaranteed.
 */
export async function verifyAndConsumeOtp(
  email: string,
  otpCode: string,
  userType: 'ADMIN' | 'CUSTOMER',
): Promise<boolean> {
  const normalised = email.toLowerCase().trim()

  const record = await prisma.passwordResetOtp.findFirst({
    where: {
      email: normalised,
      otpCode,
      userType,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) return false

  // Mark consumed atomically before returning — prevents any race-condition reuse
  await prisma.passwordResetOtp.update({
    where: { id: record.id },
    data: { used: true },
  })

  return true
}
