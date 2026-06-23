import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from 'next-auth/adapters'

// ─── Type augmentation ────────────────────────────────────────────────────────
declare module 'next-auth' {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null; phone?: string | null }
  }
}

// ─── Custom Prisma adapter: routes all adapter calls to prisma.customer ───────
// The NextAuth adapter interface expects a `user` model; our schema uses `customer`.
// Field names on Account/Session/VerificationToken are kept exactly as NextAuth expects.

function toAdapterUser(c: {
  id: string; name: string; email: string | null
  emailVerified: Date | null; image: string | null
}): AdapterUser {
  return { id: c.id, name: c.name, email: c.email ?? '', emailVerified: c.emailVerified, image: c.image }
}

function customPrismaAdapter(): Adapter {
  return {
    async createUser(user) {
      const customer = await prisma.customer.create({
        data: {
          name: user.name ?? 'New Customer',
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          phone: '',           // OAuth users fill phone later via /api/customer/profile
        },
      })
      return toAdapterUser(customer)
    },

    async getUser(id) {
      const c = await prisma.customer.findUnique({ where: { id } })
      return c ? toAdapterUser(c) : null
    },

    async getUserByEmail(email) {
      const c = await prisma.customer.findUnique({ where: { email } })
      return c ? toAdapterUser(c) : null
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { customer: true },
      })
      return account ? toAdapterUser(account.customer) : null
    },

    async updateUser(user) {
      const c = await prisma.customer.update({
        where: { id: user.id },
        data: {
          ...(user.name !== undefined && { name: user.name ?? undefined }),
          ...(user.email !== undefined && { email: user.email }),
          ...(user.emailVerified !== undefined && { emailVerified: user.emailVerified }),
          ...(user.image !== undefined && { image: user.image }),
        },
      })
      return toAdapterUser(c)
    },

    async deleteUser(id) {
      await prisma.customer.delete({ where: { id } })
    },

    async linkAccount(account) {
      await prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token ?? null,
          access_token: account.access_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state: (account.session_state as string | null) ?? null,
        },
      })
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await prisma.account.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      })
    },

    // Sessions — kept for adapter completeness; JWT strategy means these are rarely called
    async createSession(session) {
      return prisma.session.create({ data: session })
    },
    async getSessionAndUser(sessionToken) {
      const row = await prisma.session.findUnique({
        where: { sessionToken },
        include: { customer: true },
      })
      if (!row) return null
      const { customer, ...session } = row
      return { session: session as AdapterSession, user: toAdapterUser(customer) }
    },
    async updateSession(session) {
      return prisma.session.update({ where: { sessionToken: session.sessionToken }, data: session })
    },
    async deleteSession(sessionToken) {
      await prisma.session.delete({ where: { sessionToken } })
    },

    async createVerificationToken(token) {
      return prisma.verificationToken.create({ data: token })
    },
    async useVerificationToken({ identifier, token }) {
      try {
        return await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        })
      } catch {
        return null
      }
    },
  }
}

// ─── NextAuth v5 config ───────────────────────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: customPrismaAdapter(),
  session: { strategy: 'jwt' },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = String(credentials.email).toLowerCase().trim()
        const password = String(credentials.password)

        const customer = await prisma.customer.findUnique({ where: { email } })
        // Timing-safe: always run compare even when customer is null
        const dummyHash = '$2b$10$invalidhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
        const valid = await compare(password, customer?.passwordHash ?? dummyHash)

        if (!customer || !valid) return null
        return { id: customer.id, name: customer.name, email: customer.email, image: customer.image }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // `user` is only populated on the first sign-in
      if (user?.id) {
        token.id = user.id
        const customer = await prisma.customer.findUnique({
          where: { id: user.id },
          select: { phone: true },
        })
        token.phone = customer?.phone ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      if (token.phone !== undefined) session.user.phone = token.phone as string | null
      return session
    },
  },

  events: {
    /** Fires exactly once per new account — safe for idempotent guest-order backfill */
    async createUser({ user }) {
      if (!user.id || !user.email) return
      try {
        await prisma.order.updateMany({
          where: { guestEmail: user.email, customerId: null },
          data: { customerId: user.id },
        })
      } catch (e) {
        console.error('[auth] createUser backfill error:', e)
      }
    },
  },

  pages: {
    signIn: '/login',
  },
})
