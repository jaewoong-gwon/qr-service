import { NextRequest, NextResponse } from 'next/server'
import { signJWT } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: '비밀번호가 올바르지 않습니다' },
      { status: 401 }
    )
  }

  const token = await signJWT({ sub: 'admin' })
  const response = NextResponse.json({ success: true })

  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return response
}
