import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; tid: string }> }
) {
  const { tid } = await params
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from('product_tags').delete().eq('id', tid)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
