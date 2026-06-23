import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { CreateCategorySchema, UpdateCategorySchema } from '@/app/api/_lib/validators/menu'

function serverLog(ctx: string, e: unknown) {
  console.error(`[menuCategoryController] ${ctx}:`, e)
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function handlePrismaError(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') return { status: 409, data: { success: false, error: 'A category with that slug already exists' } }
    if (e.code === 'P2025') return { status: 404, data: { success: false, error: 'Category not found' } }
  }
  serverLog('prisma', e)
  return { status: 500, data: { success: false, error: 'Internal server error' } }
}

export const menuCategoryController = {
  async adminList() {
    try {
      const categories = await prisma.menuCategory.findMany({
        orderBy: { displayOrder: 'asc' },
        include: { _count: { select: { items: true } } },
      })
      return { status: 200, data: { success: true, data: categories } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async create(body: unknown) {
    const parsed = CreateCategorySchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    }
    try {
      const { name, slug, displayOrder, isActive, imageUrl } = parsed.data
      const category = await prisma.menuCategory.create({
        data: { name, slug: slug ?? toSlug(name), displayOrder, isActive, imageUrl: imageUrl ?? null },
      })
      return { status: 201, data: { success: true, data: category } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async update(id: string, body: unknown) {
    const parsed = UpdateCategorySchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    }
    try {
      const data = { ...parsed.data }
      if (data.name && !data.slug) data.slug = toSlug(data.name)
      const category = await prisma.menuCategory.update({ where: { id }, data })
      return { status: 200, data: { success: true, data: category } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },

  async delete(id: string) {
    try {
      await prisma.menuCategory.delete({ where: { id } })
      return { status: 200, data: { success: true, data: { deleted: true } } }
    } catch (e) {
      return handlePrismaError(e)
    }
  },
}
