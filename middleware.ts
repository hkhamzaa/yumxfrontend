import { NextRequest, NextResponse } from 'next/server'

// Backend removed — all routes pass through freely
export async function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
