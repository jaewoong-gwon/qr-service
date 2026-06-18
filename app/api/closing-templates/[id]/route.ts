import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getAdminId } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAdminId(request)
  if (!adminId) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id } = await params
  const { name, body } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: '템플릿 이름을 입력해주세요' }, { status: 400 })
  if (!body?.trim()) return NextResponse.json({ error: '마무리 문구를 입력해주세요' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('closing_templates')
    .update({ name: name.trim(), body: body.trim() })
    .eq('id', id)
    .select('id, name, body')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
