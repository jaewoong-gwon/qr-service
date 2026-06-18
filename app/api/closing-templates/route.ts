import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getAdminId } from '@/lib/auth'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('closing_templates')
    .select('id, name, body')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const adminId = await getAdminId(request)
  if (!adminId) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { name, body } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: '템플릿 이름을 입력해주세요' }, { status: 400 })
  if (!body?.trim()) return NextResponse.json({ error: '마무리 문구를 입력해주세요' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('closing_templates')
    .insert({ name: name.trim(), body: body.trim() })
    .select('id, name, body')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
