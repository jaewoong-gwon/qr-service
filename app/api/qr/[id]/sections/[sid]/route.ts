import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { sid } = await params
  const body = await request.json()
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('product_sections')
    .update(body)
    .eq('id', sid)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { sid } = await params
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from('product_sections').delete().eq('id', sid)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
