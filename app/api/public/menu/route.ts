import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { isDesignMode } from '@/lib/design-mode'
import { mockMenuData } from '@/lib/mock-data'

/** GET /api/public/menu — Public. Full menu + active combo deals. */
export async function GET(_req: NextRequest) {
  if (isDesignMode) {
    return NextResponse.json({ success: true, data: mockMenuData }, { status: 200 })
  }

  const { menuController } = await import('@/app/api/_lib/controllers/menuController')
  const result = await menuController.getFullMenu()
  return NextResponse.json(result.data, { status: result.status })
}
