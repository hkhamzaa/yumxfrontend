import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { testimonialController } from '@/app/api/_lib/controllers/testimonialController'

/** GET /api/public/testimonials — Public. Active testimonials ordered by displayOrder. */
export async function GET(_req: NextRequest) {
  const result = await testimonialController.getActiveTestimonials()
  return NextResponse.json(result.data, { status: result.status })
}
