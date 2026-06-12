import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { label, sort_order = 0 } = await request.json()

  if (!label?.trim()) {
    return NextResponse.json({ error: '태그명을 입력해주세요' }, { status: 400 })
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
    .from('product_tags')
    .insert({ product_id: product.id, label: label.trim(), sort_order })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
