import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params: _params }: { params: Promise<{ productId: string }> }
) {
  const body = await request.json()
  const { sections } = body as { sections: { id: string; display_order: number }[] }

  if (!Array.isArray(sections)) {
    return NextResponse.json({ error: '잘못된 형식' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const results = await Promise.all(
    sections.map(({ id, display_order }) =>
      supabase.from('product_sections').update({ display_order }).eq('id', id)
    )
  )

  const failed = results.find(({ error }) => error)
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
