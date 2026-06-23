import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { CreateVariantSchema, UpdateVariantSchema } from '@/app/api/_lib/validators/menu'

function serverLog(ctx: string, e: unknown) {
  console.error(`[menuItemVariantController] ${ctx}:`, e)
}

function handlePrismaError(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2025') return { status: 404, data: { success: false, error: 'Variant not found' } }
  }
  serverLog('prisma', e)
  return { status: 500, data: { success: false, error: 'Internal server error' } }
}

export const menuItemVariantController = {
  async list(menuItemId: string) {
    try {
      const variants = await prisma.menuItemVariant.findMany({
        where: { menuItemId },
        orderBy: { price: 'asc' },
      })
      return { status: 200, data: { success: true, data: variants } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async create(menuItemId: string, body: unknown) {
    const parsed = CreateVariantSchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    }
    try {
      const variant = await prisma.menuItemVariant.create({
        data: { menuItemId, label: parsed.data.label, price: new Prisma.Decimal(parsed.data.price) },
      })
      return { status: 201, data: { success: true, data: variant } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async update(variantId: string, body: unknown) {
    const parsed = UpdateVariantSchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    }
    try {
      const data: Record<string, unknown> = {}
      if (parsed.data.label !== undefined) data.label = parsed.data.label
      if (parsed.data.price !== undefined) data.price = new Prisma.Decimal(parsed.data.price)
      const variant = await prisma.menuItemVariant.update({ where: { id: variantId }, data })
      return { status: 200, data: { success: true, data: variant } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async delete(menuItemId: string, variantId: string) {
    try {
      const count = await prisma.menuItemVariant.count({ where: { menuItemId } })
      if (count <= 1) {
        return { status: 400, data: { success: false, error: 'Cannot delete the last variant — every item must have at least one' } }
      }
      await prisma.menuItemVariant.delete({ where: { id: variantId } })
      return { status: 200, data: { success: true, data: { deleted: true } } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },
}
