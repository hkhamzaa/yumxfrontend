import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { siteContentController } from '@/app/api/_lib/controllers/siteContentController'
import { isDesignMode } from '@/lib/design-mode'
import { mockSiteContent } from '@/lib/mock-data'

/** GET /api/public/site-content — Public. All SiteContent as key→value map. */
export async function GET(_req: NextRequest) {
  if (isDesignMode) {
    return NextResponse.json({ success: true, data: mockSiteContent }, { status: 200 })
  }

  const result = await siteContentController.getAllPublicContent()
  return NextResponse.json(result.data, { status: result.status })
}
