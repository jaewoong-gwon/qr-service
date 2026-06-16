import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getAdminId } from '@/lib/auth'
import { generateSlug } from '@/lib/qr'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, slug, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const adminId = await getAdminId(request)
  if (!adminId) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { name } = await request.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: '매장명을 입력해주세요' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const slug = generateSlug()

  const { data, error } = await supabase
    .from('stores')
    .insert({ admin_id: adminId, name: name.trim(), slug })
    .select('id, name, slug, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
