import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { CreateComboDealSchema, UpdateComboDealSchema } from '@/app/api/_lib/validators/menu'

function serverLog(ctx: string, e: unknown) {
  console.error(`[comboDealController] ${ctx}:`, e)
}

function handlePrismaError(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2025') return { status: 404, data: { success: false, error: 'Combo deal not found' } }
  }
  serverLog('prisma', e)
  return { status: 500, data: { success: false, error: 'Internal server error' } }
}

export const comboDealController = {
  async getActiveDeals() {
    try {
      const deals = await prisma.comboDeal.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      })
      return { status: 200, data: { success: true, data: deals } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async adminList() {
    try {
      const deals = await prisma.comboDeal.findMany({ orderBy: { displayOrder: 'asc' } })
      return { status: 200, data: { success: true, data: deals } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async create(body: unknown) {
    const parsed = CreateComboDealSchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    }
    try {
      const deal = await prisma.comboDeal.create({
        data: { ...parsed.data, price: new Prisma.Decimal(parsed.data.price) },
      })
      return { status: 201, data: { success: true, data: deal } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async update(id: string, body: unknown) {
    const parsed = UpdateComboDealSchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    }
    try {
      const data = { ...parsed.data } as Record<string, unknown>
      if (parsed.data.price !== undefined) data.price = new Prisma.Decimal(parsed.data.price)
      const deal = await prisma.comboDeal.update({ where: { id }, data })
      return { status: 200, data: { success: true, data: deal } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async delete(id: string) {
    try {
      await prisma.comboDeal.delete({ where: { id } })
      return { status: 200, data: { success: true, data: { deleted: true } } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },
}
