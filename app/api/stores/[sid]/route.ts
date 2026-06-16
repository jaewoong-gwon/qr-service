import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getAdminId } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sid: string }> }
) {
  const adminId = await getAdminId(request)
  if (!adminId) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { sid } = await params
  const { name } = await request.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: '매장명을 입력해주세요' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('stores')
    .update({ name: name.trim() })
    .eq('id', sid)
    .eq('admin_id', adminId)
    .select('id, name, slug, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: '매장을 찾을 수 없습니다' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sid: string }> }
) {
  const adminId = await getAdminId(request)
  if (!adminId) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { sid } = await params
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', sid)
    .eq('admin_id', adminId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
