import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerSupabaseClient } from '@/lib/supabase'
import { signJWT } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { admin_id, password } = await request.json()

  if (!admin_id || !password) {
    return NextResponse.json(
      { error: '아이디와 비밀번호를 입력해주세요' },
      { status: 400 }
    )
  }

  const supabase = createServerSupabaseClient()
  const { data: admin } = await supabase
    .from('admins')
    .select('password_hash')
    .eq('admin_id', admin_id)
    .single()

  const valid =
    admin != null && (await bcrypt.compare(password, admin.password_hash))

  if (!valid) {
    return NextResponse.json(
      { error: '아이디 또는 비밀번호가 올바르지 않습니다' },
      { status: 401 }
    )
  }

  const token = await signJWT({ sub: admin_id })
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
