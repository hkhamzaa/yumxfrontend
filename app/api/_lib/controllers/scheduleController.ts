import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { UpsertScheduleSchema, UpdateScheduleSchema } from '@/app/api/_lib/validators/content'

function serverLog(ctx: string, e: unknown) {
  console.error(`[scheduleController] ${ctx}:`, e)
}

export const scheduleController = {
  async getPublicSchedule() {
    try {
      const schedule = await prisma.restaurantSchedule.findMany({ orderBy: { dayOfWeek: 'asc' } })
      return { status: 200, data: { success: true, data: schedule } }
    } catch (e) {
      serverLog('getPublicSchedule', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  async adminGetSchedule() {
    try {
      const schedule = await prisma.restaurantSchedule.findMany({ orderBy: { dayOfWeek: 'asc' } })
      return { status: 200, data: { success: true, data: schedule } }
    } catch (e) {
      serverLog('adminGetSchedule', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  async upsertDay(body: unknown) {
    const parsed = UpsertScheduleSchema.safeParse(body)
    if (!parsed.success) return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    try {
      const entry = await prisma.restaurantSchedule.upsert({
        where: { dayOfWeek: parsed.data.dayOfWeek },
        create: parsed.data,
        update: { openTime: parsed.data.openTime, closeTime: parsed.data.closeTime, isClosed: parsed.data.isClosed },
      })
      return { status: 200, data: { success: true, data: entry } }
    } catch (e) {
      serverLog('upsertDay', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  async updateDay(id: string, body: unknown) {
    const parsed = UpdateScheduleSchema.safeParse(body)
    if (!parsed.success) return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    try {
      const entry = await prisma.restaurantSchedule.update({ where: { id }, data: parsed.data })
      return { status: 200, data: { success: true, data: entry } }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return { status: 404, data: { success: false, error: 'Schedule entry not found' } }
      }
      serverLog('updateDay', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },

  async deleteDay(id: string) {
    try {
      await prisma.restaurantSchedule.delete({ where: { id } })
      return { status: 200, data: { success: true, data: { deleted: true } } }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return { status: 404, data: { success: false, error: 'Schedule entry not found' } }
      }
      serverLog('deleteDay', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },
}
