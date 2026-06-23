import type { NextRequest } from 'next/server'

export type CustomerPayload = {
  id: string
  email: string
  name: string
}

/**
 * Resolves the NextAuth JWT session for the current request.
 * Returns a typed CustomerPayload or null when unauthenticated.
 *
 * Deliberately reads the session via the `auth()` helper from auth.ts
 * (JWT strategy — no database round-trip per request).
 */
export async function verifyCustomerSession(
  _req: NextRequest,
): Promise<CustomerPayload | null> {
  try {
    // Dynamic import avoids circular dependency between auth.ts ↔ this file
    const { auth } = await import('@/auth')
    const session = await auth()
    if (!session?.user?.id || !session.user.email) return null
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? '',
    }
  } catch {
    return null
  }
}
