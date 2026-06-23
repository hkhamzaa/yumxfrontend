import { z } from 'zod'

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const VerifyResetOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
})
