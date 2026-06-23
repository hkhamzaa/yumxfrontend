import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { UpsertSiteContentSchema, UpdateSiteContentSchema } from '@/app/api/_lib/validators/content'

function serverLog(ctx: string, e: unknown) {
  console.error(`[siteContentController] ${ctx}:`, e)
}

export const siteContentController = {
  /** Returns all content rows as a flat key→value map (public endpoint) */
  async getAllPublicContent() {
    try {
      const rows = await prisma.siteContent.findMany()
      const map = Object.fromEntries(rows.map(r => [r.key, r.value]))
      return { status: 200, data: { success: true, data: map } }
    } catch (e) {
      serverLog('getAllPublicContent', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  async adminListAll() {
    try {
      const rows = await prisma.siteContent.findMany({ orderBy: { key: 'asc' } })
      return { status: 200, data: { success: true, data: rows } }
    } catch (e) {
      serverLog('adminListAll', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  /** Upsert by key — idempotent, safe to call multiple times */
  async upsertByKey(body: unknown) {
    const parsed = UpsertSiteContentSchema.safeParse(body)
    if (!parsed.success) return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    try {
      const row = await prisma.siteContent.upsert({
        where: { key: parsed.data.key },
        create: { key: parsed.data.key, value: parsed.data.value },
        update: { value: parsed.data.value },
      })
      return { status: 200, data: { success: true, data: row } }
    } catch (e) {
      serverLog('upsertByKey', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  async update(id: string, body: unknown) {
    const parsed = UpdateSiteContentSchema.safeParse(body)
    if (!parsed.success) return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    try {
      const row = await prisma.siteContent.update({ where: { id }, data: { value: parsed.data.value } })
      return { status: 200, data: { success: true, data: row } }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return { status: 404, data: { success: false, error: 'Content entry not found' } }
      }
      serverLog('update', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  async delete(id: string) {
    try {
      await prisma.siteContent.delete({ where: { id } })
      return { status: 200, data: { success: true, data: { deleted: true } } }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return { status: 404, data: { success: false, error: 'Content entry not found' } }
      }
      serverLog('delete', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },
}
