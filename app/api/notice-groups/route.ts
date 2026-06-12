import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('notice_groups')
    .select('id, name, notice_group_items ( id, content, sort_order )')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { name } = await request.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: '그룹명을 입력해주세요' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('notice_groups')
    .insert({ name: name.trim() })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ...data, notice_group_items: [] }, { status: 201 })
}
