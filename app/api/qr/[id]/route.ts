import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from('qr_codes').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const requestBody = await request.json()
  const { name, subtitle, idus_url, store_id, closing_template_id } = requestBody

  const supabase = createServerSupabaseClient()

  const productUpdates: Record<string, string | null | boolean> = {}
  if (name !== undefined) productUpdates.name = name?.trim() ?? name
  if (subtitle !== undefined) productUpdates.subtitle = subtitle
  if (idus_url !== undefined) productUpdates.idus_url = idus_url
  if (store_id !== undefined) productUpdates.store_id = store_id
  if (closing_template_id !== undefined) productUpdates.closing_template_id = closing_template_id

  if (Object.keys(productUpdates).length > 0) {
    const { error } = await supabase
      .from('products')
      .update(productUpdates)
      .eq('qr_code_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { data, error } = await supabase
    .from('qr_codes')
    .select('*, products(*)')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // PostgREST returns one-to-many as array; normalise to single object
  const raw = data as any
  const normalized = {
    ...raw,
    products: Array.isArray(raw.products) ? (raw.products[0] ?? null) : raw.products,
  }
  return NextResponse.json(normalized)
}
