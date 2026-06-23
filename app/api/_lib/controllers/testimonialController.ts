import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { CreateTestimonialSchema, UpdateTestimonialSchema } from '@/app/api/_lib/validators/content'

function serverLog(ctx: string, e: unknown) {
  console.error(`[testimonialController] ${ctx}:`, e)
}

function handlePrismaError(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
    return { status: 404, data: { success: false, error: 'Testimonial not found' } }
  }
  serverLog('prisma', e)
  return { status: 500, data: { success: false, error: 'Internal server error' } }
}

export const testimonialController = {
  async getActiveTestimonials() {
    try {
      const testimonials = await prisma.testimonial.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      })
      return { status: 200, data: { success: true, data: testimonials } }
    } catch (e) { return handlePrismaError(e) }
  },

  async adminList() {
    try {
      const testimonials = await prisma.testimonial.findMany({ orderBy: { displayOrder: 'asc' } })
      return { status: 200, data: { success: true, data: testimonials } }
    } catch (e) { return handlePrismaError(e) }
  },

  async create(body: unknown) {
    const parsed = CreateTestimonialSchema.safeParse(body)
    if (!parsed.success) return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    try {
      const t = await prisma.testimonial.create({ data: parsed.data })
      return { status: 201, data: { success: true, data: t } }
    } catch (e) { return handlePrismaError(e) }
  },

  async update(id: string, body: unknown) {
    const parsed = UpdateTestimonialSchema.safeParse(body)
    if (!parsed.success) return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    try {
      const t = await prisma.testimonial.update({ where: { id }, data: parsed.data })
      return { status: 200, data: { success: true, data: t } }
    } catch (e) { return handlePrismaError(e) }
  },

  async delete(id: string) {
    try {
      await prisma.testimonial.delete({ where: { id } })
      return { status: 200, data: { success: true, data: { deleted: true } } }
    } catch (e) { return handlePrismaError(e) }
  },
}
