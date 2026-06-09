import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('product_sections')
    .select('*')
    .eq('product_id', productId)
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const body = await request.json()
  const { section_type, display_order, content } = body

  const VALID_SECTION_TYPES = ['hero', 'text_block', 'feature_cards', 'specs', 'recommend_list', 'quote', 'photo_section']

  if (!section_type || !VALID_SECTION_TYPES.includes(section_type) || content === undefined) {
    return NextResponse.json({ error: '필수 필드가 없습니다' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('product_sections')
    .insert({
      product_id: productId,
      section_type,
      display_order: display_order ?? 0,
      content,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
