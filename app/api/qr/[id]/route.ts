import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { parseFolderUrl } from '@/lib/drive'

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
  const { drive_folder_url, name, description, idus_url, purchase_notes } = body

  const supabase = createServerSupabaseClient()

  if (drive_folder_url !== undefined) {
    const folderId = parseFolderUrl(drive_folder_url ?? '')
    if (
      !drive_folder_url?.startsWith('https://drive.google.com/') ||
      folderId === drive_folder_url.trim()
    ) {
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
  if (idus_url !== undefined) productUpdates.idus_url = idus_url
  if (purchase_notes !== undefined) productUpdates.purchase_notes = purchase_notes

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
