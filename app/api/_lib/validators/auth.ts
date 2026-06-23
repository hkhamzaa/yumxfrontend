import { z } from 'zod'

export const CustomerForgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const CustomerVerifyResetOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
})
