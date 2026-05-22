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
  const body = await request.json()
  const { drive_folder_url, name, description, price, materials, dimensions } = body

  const supabase = createServerSupabaseClient()

  if (drive_folder_url !== undefined) {
    if (!drive_folder_url?.startsWith('https://drive.google.com/')) {
      return NextResponse.json(
        { error: '유효한 Google Drive 링크가 아닙니다' },
        { status: 400 }
      )
    }
    const { error } = await supabase
      .from('qr_codes')
      .update({ drive_folder_url })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const productUpdates: Record<string, string | null> = {}
  if (name !== undefined) productUpdates.name = name
  if (description !== undefined) productUpdates.description = description
  if (price !== undefined) productUpdates.price = price
  if (materials !== undefined) productUpdates.materials = materials
  if (dimensions !== undefined) productUpdates.dimensions = dimensions

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

  return NextResponse.json(data)
}
