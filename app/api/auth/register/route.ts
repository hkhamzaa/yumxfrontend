import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(128),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { name, email, phone, password } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  const existing = await prisma.customer.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'An account with this email already exists.' },
      { status: 409 }
    )
  }

  const passwordHash = await hash(password, 12)

  const customer = await prisma.customer.create({
    data: { name, email: normalizedEmail, phone, passwordHash },
  })

  // Backfill any guest orders placed with this email before account creation
  await prisma.order.updateMany({
    where: { guestEmail: normalizedEmail, customerId: null },
    data: { customerId: customer.id },
  }).catch(e => console.error('[register] backfill error:', e))

  return NextResponse.json({ success: true }, { status: 201 })
}
