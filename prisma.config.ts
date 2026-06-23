import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Prisma 7+ requires connection URLs here instead of in schema.prisma.
//
// DATABASE_URL → Supabase pgbouncer pooler (port 6543), no extra query params.
//   Used by PrismaClient at runtime.
// DIRECT_URL   → Supabase direct Postgres connection (port 5432).
//   Used by `prisma migrate` (pgbouncer does not support DDL statements).
export default defineConfig({
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '' },
})
