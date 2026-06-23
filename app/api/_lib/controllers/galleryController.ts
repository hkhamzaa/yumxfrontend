import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { CreateGalleryImageSchema, UpdateGalleryImageSchema } from '@/app/api/_lib/validators/content'

function serverLog(ctx: string, e: unknown) {
  console.error(`[galleryController] ${ctx}:`, e)
}

function handlePrismaError(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
    return { status: 404, data: { success: false, error: 'Image not found' } }
  }
  serverLog('prisma', e)
  return { status: 500, data: { success: false, error: 'Internal server error' } }
}

export const galleryController = {
  async getActiveImages() {
    try {
      const images = await prisma.galleryImage.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      })
      return { status: 200, data: { success: true, data: images } }
    } catch (e) { return handlePrismaError(e) }
  },

  async adminListImages() {
    try {
      const images = await prisma.galleryImage.findMany({ orderBy: { displayOrder: 'asc' } })
      return { status: 200, data: { success: true, data: images } }
    } catch (e) { return handlePrismaError(e) }
  },

  async createImage(body: unknown) {
    const parsed = CreateGalleryImageSchema.safeParse(body)
    if (!parsed.success) return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    try {
      const image = await prisma.galleryImage.create({ data: parsed.data })
      return { status: 201, data: { success: true, data: image } }
    } catch (e) { return handlePrismaError(e) }
  },

  async updateImage(id: string, body: unknown) {
    const parsed = UpdateGalleryImageSchema.safeParse(body)
    if (!parsed.success) return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    try {
      const image = await prisma.galleryImage.update({ where: { id }, data: parsed.data })
      return { status: 200, data: { success: true, data: image } }
    } catch (e) { return handlePrismaError(e) }
  },

  async deleteImage(id: string) {
    try {
      await prisma.galleryImage.delete({ where: { id } })
      return { status: 200, data: { success: true, data: { deleted: true } } }
    } catch (e) { return handlePrismaError(e) }
  },
}
