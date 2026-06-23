import { jwtVerify, SignJWT } from 'jose'
import type { NextRequest } from 'next/server'

export type AdminPayload = {
  id: string
  email: string
  role: 'SUPERADMIN' | 'ADMIN'
}

function secret() {
  const s = process.env.ADMIN_JWT_SECRET
  if (!s) throw new Error('ADMIN_JWT_SECRET env var is not set')
  return new TextEncoder().encode(s)
}

/**
 * Reads the `admin_token` httpOnly cookie, verifies the HS256 JWT signature,
 * and returns the typed payload — or null if missing/expired/tampered.
 */
export async function verifyAdminSession(
  req: NextRequest,
): Promise<AdminPayload | null> {
  try {
    const token = req.cookies.get('admin_token')?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    if (
      typeof payload.id !== 'string' ||
      typeof payload.email !== 'string' ||
      (payload.role !== 'SUPERADMIN' && payload.role !== 'ADMIN')
    )
      return null
    return { id: payload.id as string, email: payload.email as string, role: payload.role as AdminPayload['role'] }
  } catch {
    return null
  }
}

/** Signs a new admin JWT (8-hour expiry). */
export async function signAdminToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ id: payload.id, email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret())
}
