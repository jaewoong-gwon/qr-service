import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { computeSlug } from '@/lib/qr'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*, products(*)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { drive_folder_url, name, description, price, materials, dimensions } = body

  if (!drive_folder_url?.startsWith('https://drive.google.com/')) {
    return NextResponse.json(
      { error: '유효한 Google Drive 링크가 아닙니다' },
      { status: 400 }
    )
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: '제품명을 입력해주세요' }, { status: 400 })
  }

  const slug = await computeSlug(drive_folder_url)
  const supabase = createServerSupabaseClient()

  const { data: existingQr } = await supabase
    .from('qr_codes')
    .select('*, products(*)')
    .eq('slug', slug)
    .single()

  if (existingQr) {
    return NextResponse.json(existingQr, { status: 200 })
  }

  const { data: qrCode, error: qrError } = await supabase
    .from('qr_codes')
    .insert({ slug, drive_folder_url })
    .select()
    .single()

  if (qrError || !qrCode) {
    return NextResponse.json({ error: qrError?.message ?? 'QR 생성 실패' }, { status: 500 })
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      qr_code_id: qrCode.id,
      name: name.trim(),
      description: description ?? null,
      price: price ?? null,
      materials: materials ?? null,
      dimensions: dimensions ?? null,
    })
    .select()
    .single()

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 })
  }

  return NextResponse.json({ ...qrCode, products: product }, { status: 201 })
}
