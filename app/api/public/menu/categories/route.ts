import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { menuController } from '@/app/api/_lib/controllers/menuController'

/** GET /api/public/menu/categories — Public. Lightweight nav list. */
export async function GET(_req: NextRequest) {
  const result = await menuController.getCategories()
  return NextResponse.json(result.data, { status: result.status })
}
