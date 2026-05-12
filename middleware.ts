import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  if (!token || !(await verifyJWT(token))) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/dashboard',
    '/admin/qr/:path*',
    '/api/auth/logout',
    '/api/qr/:path*',
  ],
}
