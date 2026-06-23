import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { galleryController } from '@/app/api/_lib/controllers/galleryController'

/** GET /api/public/gallery — Public. Active gallery images ordered by displayOrder. */
export async function GET(_req: NextRequest) {
  const result = await galleryController.getActiveImages()
  return NextResponse.json(result.data, { status: result.status })
}
