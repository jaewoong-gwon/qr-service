import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getAdminId } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAdminId(request)
  if (!adminId) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id } = await params
  const { content_id, sort_order = 0 } = await request.json()

  if (!content_id) {
    return NextResponse.json({ error: 'content_id가 필요합니다' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('qr_code_id', id)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: '제품을 찾을 수 없습니다' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('product_content_links')
    .insert({ product_id: product.id, content_id, sort_order })
    .select('id, sort_order, content_library ( id, title, body )')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 연결된 항목입니다' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
