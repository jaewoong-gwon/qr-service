import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { sid } = await params
  const { title = null, description = null, sort_order = 0 } = await request.json()
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('product_section_items')
    .insert({ section_id: sid, title, description, sort_order })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
