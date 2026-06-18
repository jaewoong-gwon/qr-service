import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getAdminId } from '@/lib/auth'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('content_library')
    .select('id, title, body')
    .order('title')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const adminId = await getAdminId(request)
  if (!adminId) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { title, body } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: '제목을 입력해주세요' }, { status: 400 })
  if (!body?.trim()) return NextResponse.json({ error: '설명을 입력해주세요' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('content_library')
    .insert({ title: title.trim(), body: body.trim() })
    .select('id, title, body')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
