import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!)
}

export async function signJWT(payload: { sub: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(getSecret())
}

export async function verifyJWT(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}

/** JWT 쿠키에서 admins.id (UUID)를 반환. 인증 실패 시 null. */
export async function getAdminId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const adminTextId = payload.sub
    if (!adminTextId) return null
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('admins')
      .select('id')
      .eq('admin_id', adminTextId)
      .single()
    return data?.id ?? null
  } catch (err) {
    console.error('[getAdminId] 인증 실패:', err instanceof Error ? err.message : String(err))
    return null
  }
}
