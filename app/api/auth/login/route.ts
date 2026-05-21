import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerSupabaseClient } from '@/lib/supabase'
import { signJWT } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: '이메일과 비밀번호를 입력해주세요' },
      { status: 400 }
    )
  }

  const supabase = createServerSupabaseClient()
  const { data: admin } = await supabase
    .from('admins')
    .select('password_hash')
    .eq('email', email)
    .single()

  const valid =
    admin != null && (await bcrypt.compare(password, admin.password_hash))

  if (!valid) {
    return NextResponse.json(
      { error: '이메일 또는 비밀번호가 올바르지 않습니다' },
      { status: 401 }
    )
  }

  const token = await signJWT({ sub: email })
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
