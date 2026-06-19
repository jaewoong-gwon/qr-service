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
  const { title, body } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: '제목을 입력해주세요' }, { status: 400 })
  if (!body?.trim()) return NextResponse.json({ error: '설명을 입력해주세요' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('content_library')
    .update({ title: title.trim(), body: body.trim() })
    .eq('id', id)
    .select('id, title, body')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
