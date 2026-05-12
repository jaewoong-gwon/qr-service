import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { computeSlug } from '@/lib/qr'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { drive_url, product_name } = body

  if (!drive_url?.startsWith('https://drive.google.com/')) {
    return NextResponse.json(
      { error: '유효한 Google Drive 링크가 아닙니다' },
      { status: 400 }
    )
  }

  if (!product_name?.trim()) {
    return NextResponse.json({ error: '제품명을 입력해주세요' }, { status: 400 })
  }

  const slug = await computeSlug(drive_url)
  const supabase = createServerSupabaseClient()

  const { data: existing } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json(existing, { status: 200 })
  }

  const { data, error } = await supabase
    .from('qr_codes')
    .insert({ slug, drive_url, product_name: product_name.trim() })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
