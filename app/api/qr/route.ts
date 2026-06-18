import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { generateSlug } from '@/lib/qr'
import type { SectionType } from '@/lib/types'

interface TagInput { label: string; sort_order: number }
interface SectionInput {
  section_type: SectionType
  title: string | null
  body: string | null
  sort_order: number
}
interface NoticeInput {
  group_id: string | null
  new_group: { name: string; items: { content: string; sort_order: number }[] } | null
}
interface ClosingInput {
  template_id: string | null
  new_template: { name: string; body: string } | null
}
interface ContentLinkInput {
  content_id: string | null
  new_content: { title: string; body: string } | null
  sort_order: number
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

  // PostgREST returns one-to-many as array; normalise to single object
  const normalized = (data ?? []).map((item: any) => ({
    ...item,
    products: Array.isArray(item.products) ? (item.products[0] ?? null) : item.products,
  }))
  return NextResponse.json(normalized)
}

export async function POST(request: NextRequest) {
  const requestBody = await request.json()
  const { name, subtitle, idus_url, store_id } = requestBody
  const tags: TagInput[] = requestBody.tags ?? []
  const sections: SectionInput[] = requestBody.sections ?? []
  const notice: NoticeInput | null = requestBody.notice ?? null
  const closing: ClosingInput | null = requestBody.closing ?? null
  const contentLinks: ContentLinkInput[] = requestBody.content_links ?? []

  if (!name?.trim()) {
    return NextResponse.json({ error: '제품명을 입력해주세요' }, { status: 400 })
  }

  const slug = generateSlug()
  const supabase = createServerSupabaseClient()

  const { data: qrCode, error: qrError } = await supabase
    .from('qr_codes')
    .insert({ slug })
    .select()
    .single()

  if (qrError || !qrCode) {
    return NextResponse.json({ error: qrError?.message ?? 'QR 생성 실패' }, { status: 500 })
  }

  // 0. Handle closing template
  let closingTemplateId: string | null = null
  if (closing?.new_template) {
    const { data: tpl, error: tplError } = await supabase
      .from('closing_templates')
      .insert({ name: closing.new_template.name.trim(), body: closing.new_template.body.trim() })
      .select('id')
      .single()
    if (tplError || !tpl) {
      return NextResponse.json({ error: tplError?.message ?? '마무리 템플릿 생성 실패' }, { status: 500 })
    }
    closingTemplateId = tpl.id
  } else if (closing?.template_id) {
    closingTemplateId = closing.template_id
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
      store_id: store_id ?? null,
      name: name.trim(),
      subtitle: subtitle ?? null,
      idus_url: idus_url ?? null,
      is_active: true,
      notice_group_id: noticeGroupId,
      closing_template_id: closingTemplateId,
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

  // 4. Insert sections
  if (sections.length > 0) {
    const { error: secError } = await supabase.from('product_sections').insert(
      sections.map((s) => ({ ...s, product_id: product.id }))
    )
    if (secError) {
      return NextResponse.json({ error: secError.message ?? '섹션 생성 실패' }, { status: 500 })
    }
  }

  // 5. Insert content links
  if (contentLinks.length > 0) {
    for (const link of contentLinks) {
      let contentId = link.content_id
      if (link.new_content) {
        const { data: newItem, error: newItemError } = await supabase
          .from('content_library')
          .insert({ title: link.new_content.title.trim(), body: link.new_content.body.trim() })
          .select('id')
          .single()
        if (newItemError || !newItem) {
          return NextResponse.json({ error: newItemError?.message ?? '콘텐츠 생성 실패' }, { status: 500 })
        }
        contentId = newItem.id
      }
      if (contentId) {
        const { error: linkError } = await supabase
          .from('product_content_links')
          .insert({ product_id: product.id, content_id: contentId, sort_order: link.sort_order })
        if (linkError) {
          return NextResponse.json({ error: linkError.message ?? '콘텐츠 연결 실패' }, { status: 500 })
        }
      }
    }
  }

  return NextResponse.json({ ...qrCode, products: product }, { status: 201 })
}
