import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { section_type, title = null, body = null, sort_order = 0 } = await request.json()

  if (!section_type) {
    return NextResponse.json({ error: 'section_type이 필요합니다' }, { status: 400 })
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
    .from('product_sections')
    .insert({ product_id: product.id, section_type, title, body, sort_order })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
