import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { notice_group_id } = await request.json()
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('products')
    .update({ notice_group_id: notice_group_id ?? null })
    .eq('qr_code_id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
