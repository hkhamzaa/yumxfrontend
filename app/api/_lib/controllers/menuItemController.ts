import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { CreateMenuItemSchema, UpdateMenuItemSchema } from '@/app/api/_lib/validators/menu'
import type { NextRequest } from 'next/server'

function serverLog(ctx: string, e: unknown) {
  console.error(`[menuItemController] ${ctx}:`, e)
}

function handlePrismaError(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2025') return { status: 404, data: { success: false, error: 'Item not found' } }
    if (e.code === 'P2003') return { status: 400, data: { success: false, error: 'Invalid categoryId' } }
  }
  serverLog('prisma', e)
  return { status: 500, data: { success: false, error: 'Internal server error' } }
}

export const menuItemController = {
  async adminList(req: NextRequest) {
    try {
      const categoryId = req.nextUrl.searchParams.get('categoryId') ?? undefined
      const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))
      const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') ?? '50')))
      const [items, total] = await Promise.all([
        prisma.menuItem.findMany({
          where: categoryId ? { categoryId } : undefined,
          orderBy: { name: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
          include: { variants: { orderBy: { price: 'asc' } }, category: { select: { name: true, slug: true } } },
        }),
        prisma.menuItem.count({ where: categoryId ? { categoryId } : undefined }),
      ])
      return { status: 200, data: { success: true, data: { items, total, page, limit } } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async create(body: unknown) {
    const parsed = CreateMenuItemSchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    }
    try {
      const { variants, ...itemData } = parsed.data
      const item = await prisma.menuItem.create({
        data: {
          ...itemData,
          variants: { create: variants.map(v => ({ label: v.label, price: new Prisma.Decimal(v.price) })) },
        },
        include: { variants: true },
      })
      return { status: 201, data: { success: true, data: item } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async update(id: string, body: unknown) {
    const parsed = UpdateMenuItemSchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    }
    try {
      const item = await prisma.menuItem.update({ where: { id }, data: parsed.data, include: { variants: true } })
      return { status: 200, data: { success: true, data: item } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async delete(id: string) {
    try {
      await prisma.menuItem.delete({ where: { id } })
      return { status: 200, data: { success: true, data: { deleted: true } } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },
}
