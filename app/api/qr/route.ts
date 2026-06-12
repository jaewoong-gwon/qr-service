import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { computeSlug } from '@/lib/qr'
import { parseFolderUrl } from '@/lib/drive'
import type { SectionType } from '@/lib/types'

interface TagInput { label: string; sort_order: number }
interface ItemInput { title: string | null; description: string | null; sort_order: number }
interface SectionInput {
  section_type: SectionType
  title: string | null
  body: string | null
  sort_order: number
  items: ItemInput[]
}
interface NoticeInput {
  group_id: string | null
  new_group: { name: string; items: { content: string; sort_order: number }[] } | null
}

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
  const requestBody = await request.json()
  const {
    drive_folder_url,
    name,
    subtitle,
    summary,
    idus_url,
  } = requestBody
  const tags: TagInput[] = requestBody.tags ?? []
  const sections: SectionInput[] = requestBody.sections ?? []
  const notice: NoticeInput | null = requestBody.notice ?? null

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
    if (!existingQr.products) {
      const { data: product } = await supabase
        .from('products')
        .insert({
          qr_code_id: existingQr.id,
          name: name.trim(),
          subtitle: subtitle ?? null,
          summary: summary ?? null,
          idus_url: idus_url ?? null,
          is_active: true,
        })
        .select()
        .single()
      return NextResponse.json({ ...existingQr, products: product }, { status: 200 })
    }
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

  // 1. Handle notice group
  let noticeGroupId: string | null = null
  if (notice?.new_group) {
    const { data: group, error: ngError } = await supabase
      .from('notice_groups')
      .insert({ name: notice.new_group.name })
      .select()
      .single()
    if (ngError || !group) {
      return NextResponse.json({ error: ngError?.message ?? '공지 그룹 생성 실패' }, { status: 500 })
    }
    noticeGroupId = group.id
    if (notice.new_group.items.length > 0) {
      const { error: noticeItemsError } = await supabase.from('notice_group_items').insert(
        notice.new_group.items.map((item: { content: string; sort_order: number }) => ({ ...item, notice_group_id: group.id }))
      )
      if (noticeItemsError) {
        return NextResponse.json({ error: noticeItemsError.message ?? '공지 항목 생성 실패' }, { status: 500 })
      }
    }
  } else if (notice?.group_id) {
    noticeGroupId = notice.group_id
  }

  // 2. Create product
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      qr_code_id: qrCode.id,
      name: name.trim(),
      subtitle: subtitle ?? null,
      summary: summary ?? null,
      idus_url: idus_url ?? null,
      is_active: true,
      notice_group_id: noticeGroupId,
    })
    .select()
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: productError?.message ?? '제품 생성 실패' }, { status: 500 })
  }

  // 3. Insert tags
  if (tags.length > 0) {
    const { error: tagsError } = await supabase.from('product_tags').insert(
      tags.map((t) => ({ label: t.label, sort_order: t.sort_order, product_id: product.id }))
    )
    if (tagsError) {
      return NextResponse.json({ error: tagsError.message ?? '태그 생성 실패' }, { status: 500 })
    }
  }

  // 4. Insert sections + items
  for (const section of sections) {
    const { items, ...sectionData } = section
    const { data: sec, error: secError } = await supabase
      .from('product_sections')
      .insert({ ...sectionData, product_id: product.id })
      .select()
      .single()
    if (secError || !sec) {
      return NextResponse.json({ error: secError?.message ?? '섹션 생성 실패' }, { status: 500 })
    }
    if (items.length > 0) {
      const { error: itemsError } = await supabase.from('product_section_items').insert(
        items.map((item: ItemInput) => ({ ...item, section_id: sec.id }))
      )
      if (itemsError) {
        return NextResponse.json({ error: itemsError.message ?? '섹션 아이템 생성 실패' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ ...qrCode, products: product }, { status: 201 })
}
