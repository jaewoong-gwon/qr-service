import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ gid: string; iid: string }> }
) {
  const { iid } = await params
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from('notice_group_items').delete().eq('id', iid)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
