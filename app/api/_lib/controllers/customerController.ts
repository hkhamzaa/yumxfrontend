import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { UpdateProfileSchema } from '@/app/api/_lib/validators/admin'

function serverLog(ctx: string, e: unknown) {
  console.error(`[customerController] ${ctx}:`, e)
}

export const customerController = {
  /** PATCH /api/customer/profile — only mutable fields (name, phone) */
  async updateProfile(customerId: string, body: unknown) {
    const parsed = UpdateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, data: { success: false, error: parsed.error.flatten().fieldErrors } }
    }
    if (!parsed.data.name && !parsed.data.phone) {
      return { status: 400, data: { success: false, error: 'Provide at least one field to update (name or phone)' } }
    }
    try {
      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: parsed.data,
        select: { id: true, name: true, email: true, phone: true, image: true, createdAt: true },
      })
      return { status: 200, data: { success: true, data: customer } }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return { status: 404, data: { success: false, error: 'Customer not found' } }
      }
      serverLog('updateProfile', e)
      return { status: 500, data: { success: false, error: 'Internal server error' } }
    }
  },
}
