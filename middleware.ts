import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/admin') || pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  const token = req.cookies.get('admin_token')?.value

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET ?? '')
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
