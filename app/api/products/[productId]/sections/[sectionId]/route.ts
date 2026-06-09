import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; sectionId: string }> }
) {
  const { sectionId } = await params
  const body = await request.json()
  const { content } = body

  if (content === undefined) {
    return NextResponse.json({ error: 'content 필드가 없습니다' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('product_sections')
    .update({ content })
    .eq('id', sectionId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string; sectionId: string }> }
) {
  const { sectionId } = await params
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('product_sections')
    .delete()
    .eq('id', sectionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
