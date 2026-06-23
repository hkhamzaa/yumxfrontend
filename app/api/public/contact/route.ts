import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/app/api/_lib/rate-limiter'
import { sendContactEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { isDesignMode } from '@/lib/design-mode'

const ContactSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(200),
  message: z.string().min(5).max(2000).trim(),
})

/** POST /api/public/contact — rate-limited, sends email to restaurant contact address */
export async function POST(req: NextRequest) {
  if (isDesignMode) {
    return NextResponse.json({ success: true, data: { message: 'Design mode: message simulated.' } })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  // Rate limit: 3 submissions per 15 min per IP
  if (!checkRateLimit(`contact:${ip}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: 'Too many requests — please try again later.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Please fill in all fields correctly.' }, { status: 400 })
  }

  const { name, email, message } = parsed.data

  // Destination: SiteContent `email` key → fallback to SMTP_USER
  let toEmail = process.env.SMTP_USER ?? ''
  try {
    const row = await prisma.siteContent.findUnique({ where: { key: 'email' } })
    if (row?.value) toEmail = row.value
  } catch { /* use fallback */ }

  if (!toEmail) {
    return NextResponse.json({ success: false, error: 'Contact not configured.' }, { status: 503 })
  }

  try {
    await sendContactEmail({ to: toEmail, fromName: name, fromEmail: email, message })
    return NextResponse.json({ success: true, data: { message: 'Message sent! We\'ll be in touch soon.' } })
  } catch (e) {
    console.error('[/api/public/contact]', e)
    return NextResponse.json({ success: false, error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
