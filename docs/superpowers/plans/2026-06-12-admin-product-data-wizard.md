# Admin Product Data Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/qr/new` with a 5-step wizard and add TagsPanel/SectionsPanel/NoticePanel to the edit page so all product data can be entered from the admin UI.

**Architecture:** Shared Panel components in `components/admin/` work in `mode="create"` (state callbacks, no DB calls) or `mode="edit"` (immediate API calls). The wizard collects all data in browser state and POSTs everything at once on "완료". The edit page uses the same panels with immediate PATCH/POST/DELETE.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase, Tailwind CSS v4 (tokens: cream, cream-bg, gold, brown-dark, brown-mid, brown-light, brown-muted), Vitest + React Testing Library

---

## File Map

**Create:**
- `app/api/qr/[id]/tags/route.ts` — POST 태그 추가
- `app/api/qr/[id]/tags/[tid]/route.ts` — DELETE 태그 삭제
- `app/api/qr/[id]/sections/route.ts` — POST 섹션 추가
- `app/api/qr/[id]/sections/[sid]/route.ts` — PATCH/DELETE 섹션 수정/삭제
- `app/api/qr/[id]/sections/[sid]/items/route.ts` — POST 아이템 추가
- `app/api/qr/[id]/sections/[sid]/items/[iid]/route.ts` — PATCH/DELETE 아이템 수정/삭제
- `app/api/qr/[id]/notice/route.ts` — PATCH notice_group_id 변경
- `app/api/notice-groups/route.ts` — GET/POST 그룹 목록/생성
- `app/api/notice-groups/[gid]/items/route.ts` — POST 항목 추가
- `app/api/notice-groups/[gid]/items/[iid]/route.ts` — DELETE 항목 삭제
- `components/admin/TagsPanel.tsx`
- `components/admin/SectionsPanel.tsx`
- `components/admin/NoticePanel.tsx`
- `app/admin/qr/new/steps/Step1Basic.tsx`
- `app/admin/qr/new/steps/Step2Tags.tsx`
- `app/admin/qr/new/steps/Step3Sections.tsx`
- `app/admin/qr/new/steps/Step4Notice.tsx`
- `app/admin/qr/new/steps/Step5Confirm.tsx`
- `__tests__/components/admin/TagsPanel.test.tsx`
- `__tests__/components/admin/SectionsPanel.test.tsx`
- `__tests__/components/admin/NoticePanel.test.tsx`

**Modify:**
- `lib/types.ts` — `id?`/`name?` 필드 추가 (ProductTag, NoticeGroup, NoticeGroupItem, ProductSectionItem)
- `app/api/qr/route.ts` — POST에 tags/sections/notice 처리 추가
- `app/admin/qr/new/page.tsx` — wizard 컨테이너로 전면 교체
- `app/admin/qr/[id]/edit/page.tsx` — select 쿼리에 id 포함, notice_groups 목록 fetch 추가
- `app/admin/qr/[id]/edit/EditClient.tsx` — TagsPanel/SectionsPanel/NoticePanel 추가

---

## Task 1: Update lib/types.ts

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add optional id/name fields to shared types**

Replace the current interfaces:

```typescript
// lib/types.ts — FINAL

export interface QrCode {
  id: string
  slug: string
  drive_folder_url: string
  created_at: string
}

export interface NoticeGroupItem {
  id?: string
  content: string
  sort_order: number
}

export interface NoticeGroup {
  id?: string
  name?: string
  notice_group_items: NoticeGroupItem[]
}

export interface ProductTag {
  id?: string
  label: string
  sort_order: number
}

export interface ProductSectionItem {
  id?: string
  title: string | null
  description: string | null
  sort_order: number
}

export type SectionType =
  | 'meaning'
  | 'description'
  | 'color_meaning'
  | 'symbol_meaning'
  | 'option_story'
  | 'character_story'
  | 'place_story'
  | 'closing'

export interface ProductSection {
  id: string
  section_type: SectionType
  title: string | null
  body: string | null
  sort_order: number
  product_section_items: ProductSectionItem[]
}

export interface Product {
  id: string
  qr_code_id: string
  name: string
  subtitle: string | null
  summary: string | null
  idus_url: string | null
  is_active: boolean
  notice_group_id?: string | null
  product_tags?: ProductTag[]
  notice_groups?: NoticeGroup | null
  product_sections?: ProductSection[]
}

export interface QrCodeWithProduct extends QrCode {
  products: Product | null
}
```

- [ ] **Step 2: Run existing tests to verify no regressions**

```bash
npx vitest run
```

Expected: All tests pass (added optional fields are backward compatible).

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add optional id/name fields to shared types for admin editing"
```

---

## Task 2: Extend POST /api/qr to accept full product data

**Files:**
- Modify: `app/api/qr/route.ts`

The POST handler must now accept `tags`, `sections`, and `notice` in the request body and persist them after creating the qr_code and product.

- [ ] **Step 1: Update POST handler in app/api/qr/route.ts**

Replace the entire file:

```typescript
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
    tags = [] as TagInput[],
    sections = [] as SectionInput[],
    notice = null as NoticeInput | null,
  } = requestBody

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
      await supabase.from('notice_group_items').insert(
        notice.new_group.items.map((item) => ({ ...item, notice_group_id: group.id }))
      )
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
    await supabase.from('product_tags').insert(
      tags.map((t) => ({ label: t.label, sort_order: t.sort_order, product_id: product.id }))
    )
  }

  // 4. Insert sections + items
  for (const section of sections) {
    const { items, ...sectionData } = section
    const { data: sec, error: secError } = await supabase
      .from('product_sections')
      .insert({ ...sectionData, product_id: product.id })
      .select()
      .single()
    if (secError || !sec) continue
    if (items.length > 0) {
      await supabase.from('product_section_items').insert(
        items.map((item) => ({ ...item, section_id: sec.id }))
      )
    }
  }

  return NextResponse.json({ ...qrCode, products: product }, { status: 201 })
}
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run
```

Expected: All tests pass (GET and existing POST behavior unchanged).

- [ ] **Step 3: Commit**

```bash
git add app/api/qr/route.ts
git commit -m "feat: extend POST /api/qr to accept tags, sections, notice data"
```

---

## Task 3: Create tags API routes

**Files:**
- Create: `app/api/qr/[id]/tags/route.ts`
- Create: `app/api/qr/[id]/tags/[tid]/route.ts`

- [ ] **Step 1: Create app/api/qr/[id]/tags/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { label, sort_order = 0 } = await request.json()

  if (!label?.trim()) {
    return NextResponse.json({ error: '태그명을 입력해주세요' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('qr_code_id', id)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: '제품을 찾을 수 없습니다' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('product_tags')
    .insert({ product_id: product.id, label: label.trim(), sort_order })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: Create app/api/qr/[id]/tags/[tid]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; tid: string }> }
) {
  const { tid } = await params
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from('product_tags').delete().eq('id', tid)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/qr/[id]/tags/
git commit -m "feat: add tags API routes (POST, DELETE)"
```

---

## Task 4: Create sections API routes

**Files:**
- Create: `app/api/qr/[id]/sections/route.ts`
- Create: `app/api/qr/[id]/sections/[sid]/route.ts`
- Create: `app/api/qr/[id]/sections/[sid]/items/route.ts`
- Create: `app/api/qr/[id]/sections/[sid]/items/[iid]/route.ts`

- [ ] **Step 1: Create app/api/qr/[id]/sections/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { section_type, title = null, body = null, sort_order = 0 } = await request.json()

  if (!section_type) {
    return NextResponse.json({ error: 'section_type이 필요합니다' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('qr_code_id', id)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: '제품을 찾을 수 없습니다' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('product_sections')
    .insert({ product_id: product.id, section_type, title, body, sort_order })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ...data, product_section_items: [] }, { status: 201 })
}
```

- [ ] **Step 2: Create app/api/qr/[id]/sections/[sid]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { sid } = await params
  const body = await request.json()
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('product_sections')
    .update(body)
    .eq('id', sid)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { sid } = await params
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from('product_sections').delete().eq('id', sid)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Create app/api/qr/[id]/sections/[sid]/items/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { sid } = await params
  const { title = null, description = null, sort_order = 0 } = await request.json()
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('product_section_items')
    .insert({ section_id: sid, title, description, sort_order })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 4: Create app/api/qr/[id]/sections/[sid]/items/[iid]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string; iid: string }> }
) {
  const { iid } = await params
  const body = await request.json()
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('product_section_items')
    .update(body)
    .eq('id', iid)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string; iid: string }> }
) {
  const { iid } = await params
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from('product_section_items').delete().eq('id', iid)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/qr/[id]/sections/
git commit -m "feat: add sections and items API routes (POST, PATCH, DELETE)"
```

---

## Task 5: Create notice API routes

**Files:**
- Create: `app/api/qr/[id]/notice/route.ts`
- Create: `app/api/notice-groups/route.ts`
- Create: `app/api/notice-groups/[gid]/items/route.ts`
- Create: `app/api/notice-groups/[gid]/items/[iid]/route.ts`

- [ ] **Step 1: Create app/api/qr/[id]/notice/route.ts**

```typescript
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
```

- [ ] **Step 2: Create app/api/notice-groups/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('notice_groups')
    .select('id, name, notice_group_items ( id, content, sort_order )')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { name } = await request.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: '그룹명을 입력해주세요' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('notice_groups')
    .insert({ name: name.trim() })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ...data, notice_group_items: [] }, { status: 201 })
}
```

- [ ] **Step 3: Create app/api/notice-groups/[gid]/items/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gid: string }> }
) {
  const { gid } = await params
  const { content, sort_order = 0 } = await request.json()

  if (!content?.trim()) {
    return NextResponse.json({ error: '내용을 입력해주세요' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('notice_group_items')
    .insert({ notice_group_id: gid, content: content.trim(), sort_order })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 4: Create app/api/notice-groups/[gid]/items/[iid]/route.ts**

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add app/api/qr/[id]/notice/ app/api/notice-groups/
git commit -m "feat: add notice group API routes (GET, POST, PATCH, DELETE)"
```

---

## Task 6: TagsPanel component

**Files:**
- Create: `components/admin/TagsPanel.tsx`
- Create: `__tests__/components/admin/TagsPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/admin/TagsPanel.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TagsPanel } from '@/components/admin/TagsPanel'
import type { ProductTag } from '@/lib/types'

describe('TagsPanel (create mode)', () => {
  it('renders existing tags as pills', () => {
    const tags: ProductTag[] = [{ label: '한국전통', sort_order: 0 }]
    render(<TagsPanel mode="create" tags={tags} onChange={() => {}} />)
    expect(screen.getByText('한국전통')).toBeInTheDocument()
  })

  it('adds a tag when Enter is pressed', () => {
    const onChange = vi.fn()
    render(<TagsPanel mode="create" tags={[]} onChange={onChange} />)
    const input = screen.getByPlaceholderText('태그 입력 후 Enter')
    fireEvent.change(input, { target: { value: '레진' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith([{ label: '레진', sort_order: 0 }])
  })

  it('adds a tag when 추가 button is clicked', () => {
    const onChange = vi.fn()
    render(<TagsPanel mode="create" tags={[]} onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('태그 입력 후 Enter'), { target: { value: '키링' } })
    fireEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(onChange).toHaveBeenCalledWith([{ label: '키링', sort_order: 0 }])
  })

  it('removes a tag when ✕ is clicked', () => {
    const onChange = vi.fn()
    const tags: ProductTag[] = [{ label: '한국전통', sort_order: 0 }]
    render(<TagsPanel mode="create" tags={tags} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '✕' }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('does not add empty tag', () => {
    const onChange = vi.fn()
    render(<TagsPanel mode="create" tags={[]} onChange={onChange} />)
    fireEvent.keyDown(screen.getByPlaceholderText('태그 입력 후 Enter'), { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/components/admin/TagsPanel.test.tsx
```

Expected: FAIL — "Cannot find module '@/components/admin/TagsPanel'"

- [ ] **Step 3: Create components/admin/TagsPanel.tsx**

```typescript
'use client'

import { useState } from 'react'
import type { ProductTag } from '@/lib/types'

interface TagsPanelCreateProps {
  mode: 'create'
  tags: ProductTag[]
  onChange: (tags: ProductTag[]) => void
}

interface TagsPanelEditProps {
  mode: 'edit'
  tags: (ProductTag & { id: string })[]
  qrId: string
  onUpdate: (tags: (ProductTag & { id: string })[]) => void
}

export type TagsPanelProps = TagsPanelCreateProps | TagsPanelEditProps

const inputClass =
  'bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'

export function TagsPanel(props: TagsPanelProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const tags = props.tags

  async function addTag() {
    const label = input.trim()
    if (!label) return

    if (props.mode === 'create') {
      props.onChange([...tags, { label, sort_order: tags.length }])
    } else {
      setLoading(true)
      const res = await fetch(`/api/qr/${props.qrId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, sort_order: tags.length }),
      })
      if (res.ok) {
        const data = await res.json()
        props.onUpdate([...props.tags, data])
      }
      setLoading(false)
    }
    setInput('')
  }

  async function removeTag(index: number) {
    if (props.mode === 'create') {
      props.onChange(tags.filter((_, i) => i !== index))
    } else {
      const tag = props.tags[index]
      setLoading(true)
      await fetch(`/api/qr/${props.qrId}/tags/${tag.id}`, { method: 'DELETE' })
      props.onUpdate(props.tags.filter((_, i) => i !== index))
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="flex items-center gap-1 text-xs font-medium text-brown-mid bg-cream-bg px-3 py-1 rounded-full border border-gold/30"
          >
            {tag.label}
            <button
              type="button"
              aria-label="✕"
              onClick={() => removeTag(i)}
              disabled={loading}
              className="ml-1 text-brown-muted hover:text-brown-dark leading-none"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder="태그 입력 후 Enter"
          className={`flex-1 ${inputClass}`}
          disabled={loading}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={loading || !input.trim()}
          className="px-4 py-2 text-sm bg-gold text-cream rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
        >
          추가
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/admin/TagsPanel.test.tsx
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/TagsPanel.tsx __tests__/components/admin/TagsPanel.test.tsx
git commit -m "feat: add TagsPanel component with create/edit mode"
```

---

## Task 7: SectionsPanel component

**Files:**
- Create: `components/admin/SectionsPanel.tsx`
- Create: `__tests__/components/admin/SectionsPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/admin/SectionsPanel.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionsPanel } from '@/components/admin/SectionsPanel'
import type { ProductSection } from '@/lib/types'

const mockSection: ProductSection = {
  id: 'tmp-1',
  section_type: 'meaning',
  title: '갓의 의미',
  body: '조선시대...',
  sort_order: 0,
  product_section_items: [],
}

describe('SectionsPanel (create mode)', () => {
  it('renders add button when empty', () => {
    render(<SectionsPanel mode="create" sections={[]} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: '+ 섹션 추가' })).toBeInTheDocument()
  })

  it('renders existing section title input', () => {
    render(<SectionsPanel mode="create" sections={[mockSection]} onChange={() => {}} />)
    expect(screen.getByDisplayValue('갓의 의미')).toBeInTheDocument()
  })

  it('adds a new section when button is clicked', () => {
    const onChange = vi.fn()
    render(<SectionsPanel mode="create" sections={[]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '+ 섹션 추가' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ section_type: 'meaning', title: null, body: null }),
      ])
    )
  })

  it('removes a section when 삭제 button is clicked', () => {
    const onChange = vi.fn()
    render(<SectionsPanel mode="create" sections={[mockSection]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '섹션 삭제' }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('shows item form for color_meaning type', () => {
    const colorSection: ProductSection = {
      ...mockSection,
      section_type: 'color_meaning',
      product_section_items: [],
    }
    render(<SectionsPanel mode="create" sections={[colorSection]} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: '+ 아이템 추가' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/components/admin/SectionsPanel.test.tsx
```

Expected: FAIL — "Cannot find module '@/components/admin/SectionsPanel'"

- [ ] **Step 3: Create components/admin/SectionsPanel.tsx**

```typescript
'use client'

import { useState } from 'react'
import type { ProductSection, ProductSectionItem, SectionType } from '@/lib/types'

interface SectionsPanelCreateProps {
  mode: 'create'
  sections: ProductSection[]
  onChange: (sections: ProductSection[]) => void
}

interface SectionsPanelEditProps {
  mode: 'edit'
  sections: ProductSection[]
  qrId: string
  onUpdate: (sections: ProductSection[]) => void
}

export type SectionsPanelProps = SectionsPanelCreateProps | SectionsPanelEditProps

const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  meaning: '의미',
  description: '제품 설명',
  color_meaning: '색상별 의미',
  symbol_meaning: '상징별 의미',
  option_story: '옵션 이야기',
  character_story: '캐릭터 이야기',
  place_story: '장소 이야기',
  closing: '마무리 문구',
}

const ITEM_TYPES: SectionType[] = ['color_meaning', 'symbol_meaning']

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const selectClass =
  'bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold'

function newSection(sortOrder: number): ProductSection {
  return {
    id: crypto.randomUUID(),
    section_type: 'meaning',
    title: null,
    body: null,
    sort_order: sortOrder,
    product_section_items: [],
  }
}

export function SectionsPanel(props: SectionsPanelProps) {
  const [loading, setLoading] = useState(false)
  const sections = props.sections

  function updateSections(next: ProductSection[]) {
    if (props.mode === 'create') props.onChange(next)
    else props.onUpdate(next)
  }

  async function addSection() {
    if (props.mode === 'create') {
      updateSections([...sections, newSection(sections.length)])
      return
    }
    setLoading(true)
    const res = await fetch(`/api/qr/${props.qrId}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_type: 'meaning', title: null, body: null, sort_order: sections.length }),
    })
    if (res.ok) {
      const data = await res.json()
      props.onUpdate([...sections, data])
    }
    setLoading(false)
  }

  async function removeSection(index: number) {
    const section = sections[index]
    if (props.mode === 'edit') {
      setLoading(true)
      await fetch(`/api/qr/${props.qrId}/sections/${section.id}`, { method: 'DELETE' })
      setLoading(false)
    }
    updateSections(sections.filter((_, i) => i !== index))
  }

  function updateField(index: number, field: keyof ProductSection, value: string | null) {
    const next = sections.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    updateSections(next)
  }

  async function saveField(index: number, field: string, value: string | null) {
    if (props.mode !== 'edit') return
    const section = sections[index]
    await fetch(`/api/qr/${props.qrId}/sections/${section.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
  }


  function addItem(sectionIndex: number) {
    const section = sections[sectionIndex]
    const newItem: ProductSectionItem = {
      title: null,
      description: null,
      sort_order: section.product_section_items.length,
    }
    const next = sections.map((s, i) =>
      i === sectionIndex
        ? { ...s, product_section_items: [...s.product_section_items, newItem] }
        : s
    )
    updateSections(next)
  }

  async function removeItem(sectionIndex: number, itemIndex: number) {
    const section = sections[sectionIndex]
    const item = section.product_section_items[itemIndex]
    if (props.mode === 'edit' && item.id) {
      setLoading(true)
      await fetch(`/api/qr/${props.qrId}/sections/${section.id}/items/${item.id}`, { method: 'DELETE' })
      setLoading(false)
    }
    const next = sections.map((s, i) =>
      i === sectionIndex
        ? { ...s, product_section_items: s.product_section_items.filter((_, j) => j !== itemIndex) }
        : s
    )
    updateSections(next)
  }

  function updateItem(sectionIndex: number, itemIndex: number, field: 'title' | 'description', value: string | null) {
    const next = sections.map((s, i) =>
      i === sectionIndex
        ? {
            ...s,
            product_section_items: s.product_section_items.map((item, j) =>
              j === itemIndex ? { ...item, [field]: value } : item
            ),
          }
        : s
    )
    updateSections(next)
  }

  async function saveItem(sectionIndex: number, itemIndex: number, field: string, value: string | null) {
    if (props.mode !== 'edit') return
    const section = sections[sectionIndex]
    const item = section.product_section_items[itemIndex]
    if (!item.id) return
    await fetch(`/api/qr/${props.qrId}/sections/${section.id}/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
  }

  function moveSection(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sections.length) return
    const next = [...sections]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    next.forEach((s, i) => { s.sort_order = i })
    updateSections(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section, sIdx) => (
        <div key={section.id} className="border border-gold/30 rounded-lg p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <select
              value={section.section_type}
              onChange={(e) => {
                updateField(sIdx, 'section_type', e.target.value)
                if (props.mode === 'edit') saveField(sIdx, 'section_type', e.target.value)
              }}
              className={selectClass}
            >
              {(Object.keys(SECTION_TYPE_LABELS) as SectionType[]).map((type) => (
                <option key={type} value={type}>{SECTION_TYPE_LABELS[type]}</option>
              ))}
            </select>
            <div className="flex gap-1 ml-auto">
              <button
                type="button"
                onClick={() => moveSection(sIdx, -1)}
                disabled={sIdx === 0 || loading}
                className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
              >↑</button>
              <button
                type="button"
                onClick={() => moveSection(sIdx, 1)}
                disabled={sIdx === sections.length - 1 || loading}
                className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
              >↓</button>
              <button
                type="button"
                aria-label="섹션 삭제"
                onClick={() => removeSection(sIdx)}
                disabled={loading}
                className="px-2 py-1 text-xs border border-red-200 rounded text-red-400 hover:bg-red-50 disabled:opacity-30"
              >삭제</button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <input
              value={section.title ?? ''}
              onChange={(e) => updateField(sIdx, 'title', e.target.value || null)}
              onBlur={(e) => saveField(sIdx, 'title', e.target.value || null)}
              placeholder="제목 (선택)"
              className={inputClass}
            />
            <textarea
              value={section.body ?? ''}
              onChange={(e) => updateField(sIdx, 'body', e.target.value || null)}
              onBlur={(e) => saveField(sIdx, 'body', e.target.value || null)}
              placeholder="본문 내용"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {ITEM_TYPES.includes(section.section_type) && (
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-xs font-bold text-brown-mid">아이템</p>
              {section.product_section_items.map((item, iIdx) => (
                <div key={iIdx} className="flex gap-2 items-start">
                  <input
                    value={item.title ?? ''}
                    onChange={(e) => updateItem(sIdx, iIdx, 'title', e.target.value || null)}
                    onBlur={(e) => saveItem(sIdx, iIdx, 'title', e.target.value || null)}
                    placeholder="제목"
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    value={item.description ?? ''}
                    onChange={(e) => updateItem(sIdx, iIdx, 'description', e.target.value || null)}
                    onBlur={(e) => saveItem(sIdx, iIdx, 'description', e.target.value || null)}
                    placeholder="설명"
                    className={`${inputClass} flex-[2]`}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(sIdx, iIdx)}
                    disabled={loading}
                    className="px-2 py-2 text-xs text-red-400 border border-red-200 rounded hover:bg-red-50 disabled:opacity-30"
                  >✕</button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem(sIdx)}
                className="self-start text-xs px-3 py-1.5 border border-gold/40 rounded text-brown-mid hover:bg-gold/10"
              >+ 아이템 추가</button>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addSection}
        disabled={loading}
        className="w-full py-2.5 text-sm border border-dashed border-gold/50 rounded-lg text-brown-mid hover:bg-gold/5 disabled:opacity-50 transition-colors"
      >+ 섹션 추가</button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/admin/SectionsPanel.test.tsx
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/SectionsPanel.tsx __tests__/components/admin/SectionsPanel.test.tsx
git commit -m "feat: add SectionsPanel component with create/edit mode"
```

---

## Task 8: NoticePanel component

**Files:**
- Create: `components/admin/NoticePanel.tsx`
- Create: `__tests__/components/admin/NoticePanel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/admin/NoticePanel.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NoticePanel } from '@/components/admin/NoticePanel'
import type { NoticeGroup } from '@/lib/types'

const mockGroups: (NoticeGroup & { id: string; name: string })[] = [
  { id: 'g1', name: '레진 상품 공통 안내', notice_group_items: [] },
]

describe('NoticePanel (create mode)', () => {
  it('renders "없음" option by default', () => {
    render(<NoticePanel mode="create" noticeData={null} groups={[]} onChange={() => {}} />)
    expect(screen.getByText('구매 안내 없음')).toBeInTheDocument()
  })

  it('shows new group form when 새 그룹 만들기 is clicked', () => {
    render(<NoticePanel mode="create" noticeData={null} groups={[]} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '새 그룹 만들기' }))
    expect(screen.getByPlaceholderText('그룹명 (예: 레진 상품 공통 안내)')).toBeInTheDocument()
  })

  it('renders existing groups in dropdown', () => {
    render(<NoticePanel mode="create" noticeData={null} groups={mockGroups} onChange={() => {}} />)
    expect(screen.getByRole('option', { name: '레진 상품 공통 안내' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/components/admin/NoticePanel.test.tsx
```

Expected: FAIL — "Cannot find module '@/components/admin/NoticePanel'"

- [ ] **Step 3: Create components/admin/NoticePanel.tsx**

```typescript
'use client'

import { useState } from 'react'
import type { NoticeGroup, NoticeGroupItem } from '@/lib/types'

export interface NoticeFormData {
  mode: 'existing' | 'new'
  groupId: string | null
  newGroup: { name: string; items: { content: string; sort_order: number }[] } | null
}

type NoticeGroupFull = NoticeGroup & { id: string; name: string }

interface NoticePanelCreateProps {
  mode: 'create'
  noticeData: NoticeFormData | null
  groups: NoticeGroupFull[]
  onChange: (data: NoticeFormData | null) => void
}

interface NoticePanelEditProps {
  mode: 'edit'
  currentGroupId: string | null
  groups: NoticeGroupFull[]
  qrId: string
  onUpdate: (groupId: string | null) => void
}

export type NoticePanelProps = NoticePanelCreateProps | NoticePanelEditProps

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const selectClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold'

export function NoticePanel(props: NoticePanelProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newItems, setNewItems] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)

  const groups = props.groups

  function handleExistingSelect(groupId: string) {
    if (props.mode === 'create') {
      props.onChange(groupId ? { mode: 'existing', groupId, newGroup: null } : null)
    } else {
      setLoading(true)
      fetch(`/api/qr/${props.qrId}/notice`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notice_group_id: groupId || null }),
      }).finally(() => {
        props.onUpdate(groupId || null)
        setLoading(false)
      })
    }
  }

  function addItemRow() {
    setNewItems([...newItems, ''])
  }

  function updateItemRow(index: number, value: string) {
    setNewItems(newItems.map((v, i) => (i === index ? value : v)))
  }

  function removeItemRow(index: number) {
    setNewItems(newItems.filter((_, i) => i !== index))
  }

  function confirmNewGroup() {
    const items = newItems
      .map((content, i) => ({ content: content.trim(), sort_order: i }))
      .filter((item) => item.content)

    if (props.mode === 'create') {
      props.onChange({
        mode: 'new',
        groupId: null,
        newGroup: { name: newGroupName.trim(), items },
      })
      setShowNewForm(false)
    }
  }

  const selectedGroupId =
    props.mode === 'create'
      ? props.noticeData?.mode === 'existing'
        ? props.noticeData.groupId
        : ''
      : props.currentGroupId ?? ''

  return (
    <div className="flex flex-col gap-3">
      {!showNewForm && (
        <>
          <div>
            <label className="block text-xs font-bold text-brown-mid mb-1">기존 그룹 선택</label>
            <select
              value={selectedGroupId ?? ''}
              onChange={(e) => handleExistingSelect(e.target.value)}
              className={selectClass}
              disabled={loading}
            >
              <option value="">구매 안내 없음</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="self-start text-xs px-3 py-1.5 border border-gold/40 rounded text-brown-mid hover:bg-gold/10"
          >새 그룹 만들기</button>
        </>
      )}

      {showNewForm && (
        <div className="border border-gold/30 rounded-lg p-4 bg-white flex flex-col gap-3">
          <p className="text-xs font-bold text-brown-dark">새 구매 안내 그룹</p>
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="그룹명 (예: 레진 상품 공통 안내)"
            className={inputClass}
          />
          <div className="flex flex-col gap-2">
            {newItems.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={item}
                  onChange={(e) => updateItemRow(i, e.target.value)}
                  placeholder={`안내 항목 ${i + 1}`}
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={() => removeItemRow(i)}
                  className="px-2 text-red-400 border border-red-200 rounded hover:bg-red-50"
                >✕</button>
              </div>
            ))}
            <button
              type="button"
              onClick={addItemRow}
              className="self-start text-xs px-3 py-1.5 border border-gold/40 rounded text-brown-mid hover:bg-gold/10"
            >+ 항목 추가</button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmNewGroup}
              disabled={!newGroupName.trim()}
              className="px-4 py-2 text-sm bg-gold text-cream rounded-lg hover:bg-gold/90 disabled:opacity-50"
            >확인</button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 text-sm border border-gold/40 rounded-lg text-brown-light hover:bg-gold/10"
            >취소</button>
          </div>
        </div>
      )}

      {props.mode === 'create' && props.noticeData?.mode === 'new' && props.noticeData.newGroup && (
        <div className="text-xs text-brown-mid bg-cream-bg rounded-lg px-3 py-2">
          새 그룹: <span className="font-bold text-brown-dark">{props.noticeData.newGroup.name}</span>
          {' '}({props.noticeData.newGroup.items.length}개 항목)
          <button
            type="button"
            onClick={() => { setShowNewForm(true); props.onChange(null) }}
            className="ml-2 text-gold underline"
          >수정</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/admin/NoticePanel.test.tsx
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add components/admin/NoticePanel.tsx __tests__/components/admin/NoticePanel.test.tsx
git commit -m "feat: add NoticePanel component with create/edit mode"
```

---

## Task 9: Wizard — page.tsx + Step components

**Files:**
- Modify: `app/admin/qr/new/page.tsx`
- Create: `app/admin/qr/new/steps/Step1Basic.tsx`
- Create: `app/admin/qr/new/steps/Step2Tags.tsx`
- Create: `app/admin/qr/new/steps/Step3Sections.tsx`
- Create: `app/admin/qr/new/steps/Step4Notice.tsx`
- Create: `app/admin/qr/new/steps/Step5Confirm.tsx`

- [ ] **Step 1: Create app/admin/qr/new/steps/Step1Basic.tsx**

```typescript
'use client'

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'
const hintClass = 'text-[11px] text-brown-muted font-normal'

export interface BasicData {
  name: string
  driveUrl: string
  subtitle: string
  summary: string
  idusUrl: string
}

interface Step1Props {
  data: BasicData
  onChange: (data: BasicData) => void
}

export function Step1Basic({ data, onChange }: Step1Props) {
  function set(field: keyof BasicData, value: string) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>
          Google Drive 폴더 URL <span className="text-gold">*</span>
        </label>
        <input
          type="url"
          value={data.driveUrl}
          onChange={(e) => set('driveUrl', e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          className={inputClass}
          required
        />
        <p className={`mt-1.5 ${hintClass}`}>사진이 저장된 공개 Google Drive 폴더 주소를 입력하세요.</p>
      </div>
      <div>
        <label className={labelClass}>
          제품명 <span className="text-gold">*</span>
        </label>
        <input
          value={data.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="레진 갓 키링"
          className={inputClass}
          required
        />
      </div>
      <div>
        <label className={labelClass}>
          한 줄 카피 <span className={hintClass}>(선택 · 제품명 위에 표시)</span>
        </label>
        <input
          value={data.subtitle}
          onChange={(e) => set('subtitle', e.target.value)}
          placeholder="전통의 아름다움을 일상 속에"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>
          요약 <span className={hintClass}>(선택 · hero 하단)</span>
        </label>
        <textarea
          value={data.summary}
          onChange={(e) => set('summary', e.target.value)}
          rows={2}
          placeholder="제품에 대한 짧은 요약 문장"
          className={`${inputClass} resize-none`}
        />
      </div>
      <div>
        <label className={labelClass}>
          아이디어스 구매 링크 <span className={hintClass}>(권장)</span>
        </label>
        <input
          type="url"
          value={data.idusUrl}
          onChange={(e) => set('idusUrl', e.target.value)}
          placeholder="https://www.idus.com/v2/product/..."
          className={inputClass}
        />
        <p className={`mt-1.5 ${hintClass}`}>없으면 CTA 버튼이 노출되지 않습니다.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create app/admin/qr/new/steps/Step2Tags.tsx**

```typescript
'use client'

import { TagsPanel } from '@/components/admin/TagsPanel'
import type { ProductTag } from '@/lib/types'

interface Step2Props {
  tags: ProductTag[]
  onChange: (tags: ProductTag[]) => void
}

export function Step2Tags({ tags, onChange }: Step2Props) {
  return (
    <div>
      <p className="text-xs text-brown-muted mb-4">
        태그는 hero 영역에 pill 형태로 표시됩니다. 예: #레진 #한국전통 #키링
      </p>
      <TagsPanel mode="create" tags={tags} onChange={onChange} />
    </div>
  )
}
```

- [ ] **Step 3: Create app/admin/qr/new/steps/Step3Sections.tsx**

```typescript
'use client'

import { SectionsPanel } from '@/components/admin/SectionsPanel'
import type { ProductSection } from '@/lib/types'

interface Step3Props {
  sections: ProductSection[]
  onChange: (sections: ProductSection[]) => void
}

export function Step3Sections({ sections, onChange }: Step3Props) {
  return (
    <div>
      <p className="text-xs text-brown-muted mb-4">
        섹션은 랜딩 페이지 본문에 순서대로 표시됩니다. closing 타입은 중앙 정렬 + 금색 따옴표로 표시됩니다.
      </p>
      <SectionsPanel mode="create" sections={sections} onChange={onChange} />
    </div>
  )
}
```

- [ ] **Step 4: Create app/admin/qr/new/steps/Step4Notice.tsx**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { NoticePanel } from '@/components/admin/NoticePanel'
import type { NoticeFormData } from '@/components/admin/NoticePanel'
import type { NoticeGroup } from '@/lib/types'

type NoticeGroupFull = NoticeGroup & { id: string; name: string }

interface Step4Props {
  noticeData: NoticeFormData | null
  onChange: (data: NoticeFormData | null) => void
}

export function Step4Notice({ noticeData, onChange }: Step4Props) {
  const [groups, setGroups] = useState<NoticeGroupFull[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/notice-groups')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGroups(data)
      })
      .finally(() => setFetching(false))
  }, [])

  return (
    <div>
      <p className="text-xs text-brown-muted mb-4">
        구매 전 확인사항을 그룹으로 관리합니다. 여러 제품이 같은 그룹을 공유할 수 있습니다.
      </p>
      {fetching ? (
        <p className="text-sm text-brown-muted">불러오는 중...</p>
      ) : (
        <NoticePanel mode="create" noticeData={noticeData} groups={groups} onChange={onChange} />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create app/admin/qr/new/steps/Step5Confirm.tsx**

```typescript
'use client'

import type { BasicData } from './Step1Basic'
import type { ProductTag, ProductSection } from '@/lib/types'
import type { NoticeFormData } from '@/components/admin/NoticePanel'

const SECTION_TYPE_LABELS: Record<string, string> = {
  meaning: '의미', description: '제품 설명', color_meaning: '색상별 의미',
  symbol_meaning: '상징별 의미', option_story: '옵션 이야기',
  character_story: '캐릭터 이야기', place_story: '장소 이야기', closing: '마무리 문구',
}

interface Step5Props {
  basic: BasicData
  tags: ProductTag[]
  sections: ProductSection[]
  noticeData: NoticeFormData | null
  error: string
  loading: boolean
  onSubmit: () => void
}

export function Step5Confirm({ basic, tags, sections, noticeData, error, loading, onSubmit }: Step5Props) {
  return (
    <div className="flex flex-col gap-5">
      <Section title="기본 정보">
        <Row label="제품명" value={basic.name || '(없음)'} />
        <Row label="Drive URL" value={basic.driveUrl || '(없음)'} />
        {basic.subtitle && <Row label="한 줄 카피" value={basic.subtitle} />}
        {basic.summary && <Row label="요약" value={basic.summary} />}
        {basic.idusUrl && <Row label="아이디어스 링크" value={basic.idusUrl} />}
      </Section>

      <Section title={`태그 (${tags.length}개)`}>
        {tags.length === 0 ? (
          <p className="text-xs text-brown-muted">없음</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-cream-bg border border-gold/30 rounded-full text-brown-mid">
                {t.label}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title={`섹션 (${sections.length}개)`}>
        {sections.length === 0 ? (
          <p className="text-xs text-brown-muted">없음</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sections.map((s, i) => (
              <li key={i} className="text-xs text-brown-mid">
                {i + 1}. [{SECTION_TYPE_LABELS[s.section_type] ?? s.section_type}]
                {s.title ? ` ${s.title}` : ''}
                {s.product_section_items.length > 0 && ` (아이템 ${s.product_section_items.length}개)`}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="구매 안내">
        {!noticeData ? (
          <p className="text-xs text-brown-muted">없음</p>
        ) : noticeData.mode === 'existing' ? (
          <p className="text-xs text-brown-mid">기존 그룹 연결</p>
        ) : noticeData.newGroup ? (
          <p className="text-xs text-brown-mid">
            새 그룹 생성: {noticeData.newGroup.name} ({noticeData.newGroup.items.length}개 항목)
          </p>
        ) : null}
      </Section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || !basic.name.trim() || !basic.driveUrl.trim()}
        className="w-full py-3 text-sm bg-gold text-cream font-bold rounded-xl hover:bg-gold/90 disabled:opacity-50 transition-colors"
      >
        {loading ? '생성 중...' : '완료 — QR 생성'}
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gold/30 rounded-lg px-4 py-3">
      <p className="text-xs font-bold tracking-[2px] text-gold uppercase mb-2">{title}</p>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-brown-muted w-24 shrink-0">{label}</span>
      <span className="text-brown-dark break-all">{value}</span>
    </div>
  )
}
```

- [ ] **Step 6: Rewrite app/admin/qr/new/page.tsx as wizard container**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import { Step1Basic, type BasicData } from './steps/Step1Basic'
import { Step2Tags } from './steps/Step2Tags'
import { Step3Sections } from './steps/Step3Sections'
import { Step4Notice } from './steps/Step4Notice'
import { Step5Confirm } from './steps/Step5Confirm'
import type { NoticeFormData } from '@/components/admin/NoticePanel'
import type { Product, ProductTag, ProductSection } from '@/lib/types'

const PREVIEW_SCALE = 0.923
const INNER_W = 390
const INNER_H = 800
const OUTER_W = Math.round(INNER_W * PREVIEW_SCALE)
const OUTER_H = Math.round(INNER_H * PREVIEW_SCALE)

const STEP_LABELS = ['기본 정보', '태그', '섹션', '구매 안내', '확인']

const INITIAL_BASIC: BasicData = { name: '', driveUrl: '', subtitle: '', summary: '', idusUrl: '' }

export default function NewQrPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [basic, setBasic] = useState<BasicData>(INITIAL_BASIC)
  const [tags, setTags] = useState<ProductTag[]>([])
  const [sections, setSections] = useState<ProductSection[]>([])
  const [noticeData, setNoticeData] = useState<NoticeFormData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const previewProduct: Product = {
    id: '',
    qr_code_id: '',
    name: basic.name.trim() || '(제품명)',
    subtitle: basic.subtitle.trim() || null,
    summary: basic.summary.trim() || null,
    idus_url: basic.idusUrl.trim() || null,
    is_active: true,
    product_tags: tags,
    product_sections: sections,
    notice_groups: noticeData?.mode === 'new' && noticeData.newGroup
      ? { notice_group_items: noticeData.newGroup.items.map((item, i) => ({ content: item.content, sort_order: i })) }
      : null,
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const body = {
      name: basic.name.trim(),
      drive_folder_url: basic.driveUrl.trim(),
      subtitle: basic.subtitle.trim() || null,
      summary: basic.summary.trim() || null,
      idus_url: basic.idusUrl.trim() || null,
      tags: tags.map((t, i) => ({ label: t.label, sort_order: i })),
      sections: sections.map((s, i) => ({
        section_type: s.section_type,
        title: s.title,
        body: s.body,
        sort_order: i,
        items: s.product_section_items.map((item, j) => ({
          title: item.title,
          description: item.description,
          sort_order: j,
        })),
      })),
      notice: noticeData
        ? {
            group_id: noticeData.mode === 'existing' ? noticeData.groupId : null,
            new_group: noticeData.mode === 'new' ? noticeData.newGroup : null,
          }
        : null,
    }

    const res = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push('/admin/dashboard')
    } else {
      const data = await res.json()
      setError(data.error ?? '생성에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      <nav className="bg-cream border-b border-gold/30 px-8 py-4 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-sm text-brown-light border border-gold/40 rounded-md px-3 py-1.5 hover:bg-gold/10 transition-colors"
            >
              ← 목록
            </Link>
            <div>
              <h1 className="text-base font-bold text-brown-dark">새 QR 코드 생성</h1>
              <span className="text-[9px] tracking-[3px] text-gold">NEW QR CODE</span>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1.5">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStep(i + 1)}
                  className={`w-6 h-6 rounded-full text-xs font-bold transition-colors ${
                    step === i + 1
                      ? 'bg-gold text-cream'
                      : step > i + 1
                      ? 'bg-gold/30 text-brown-dark'
                      : 'bg-cream-bg text-brown-muted border border-gold/30'
                  }`}
                >
                  {i + 1}
                </button>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`w-4 h-px ${step > i + 1 ? 'bg-gold/50' : 'bg-gold/20'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-8 py-8">
        <div className="flex gap-8 items-start">
          {/* 왼쪽: 단계 폼 */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">
                {STEP_LABELS[step - 1]}
              </p>

              {step === 1 && <Step1Basic data={basic} onChange={setBasic} />}
              {step === 2 && <Step2Tags tags={tags} onChange={setTags} />}
              {step === 3 && <Step3Sections sections={sections} onChange={setSections} />}
              {step === 4 && <Step4Notice noticeData={noticeData} onChange={setNoticeData} />}
              {step === 5 && (
                <Step5Confirm
                  basic={basic}
                  tags={tags}
                  sections={sections}
                  noticeData={noticeData}
                  error={error}
                  loading={loading}
                  onSubmit={handleSubmit}
                />
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="px-5 py-2.5 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 disabled:opacity-30 transition-colors"
              >
                ← 이전
              </button>
              {step < 5 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(5, s + 1))}
                  className="px-6 py-2.5 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 transition-colors"
                >
                  다음 →
                </button>
              )}
            </div>
          </div>

          {/* 오른쪽: 실시간 미리보기 */}
          <div className="w-[400px] flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
                실시간 미리보기
              </p>
              <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
                <div
                  className="relative overflow-hidden rounded-[36px] border-4 border-brown-dark/30 shadow-2xl bg-cream-bg"
                  style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px` }}
                >
                  <div
                    className="absolute top-0 left-0"
                    style={{
                      width: `${INNER_W}px`,
                      height: `${INNER_H}px`,
                      transform: `scale(${PREVIEW_SCALE})`,
                      transformOrigin: 'top left',
                      pointerEvents: 'none',
                    }}
                  >
                    <ProductLandingPage product={previewProduct} images={[]} />
                  </div>
                </div>
                <p className="text-xs text-brown-muted text-center mt-2">
                  이미지는 생성 후 수정 페이지에서 확인됩니다
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 7: Run tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add app/admin/qr/new/
git commit -m "feat: replace /qr/new with 5-step wizard with live preview"
```

---

## Task 10: Update EditClient and edit/page.tsx

**Files:**
- Modify: `app/admin/qr/[id]/edit/page.tsx`
- Modify: `app/admin/qr/[id]/edit/EditClient.tsx`

- [ ] **Step 1: Update app/admin/qr/[id]/edit/page.tsx**

Update the select query to include `id` fields, and fetch all notice groups in parallel:

```typescript
import { createServerSupabaseClient } from '@/lib/supabase'
import { getFolderImages } from '@/lib/drive'
import { notFound } from 'next/navigation'
import { EditClient } from './EditClient'
import type { QrCodeWithProduct, NoticeGroup } from '@/lib/types'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerSupabaseClient()

  const [{ data, error }, { data: allGroups }] = await Promise.all([
    supabase
      .from('qr_codes')
      .select(`
        *,
        products (
          *,
          product_tags ( id, label, sort_order ),
          notice_groups ( id, name, notice_group_items ( id, content, sort_order ) ),
          product_sections (
            *,
            product_section_items ( id, title, description, sort_order )
          )
        )
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('notice_groups')
      .select('id, name, notice_group_items ( id, content, sort_order )')
      .order('name'),
  ])

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  if (!data) notFound()

  const item = data as unknown as QrCodeWithProduct
  const images = await getFolderImages(item.drive_folder_url)
  const groups = (allGroups ?? []) as (NoticeGroup & { id: string; name: string })[]

  return <EditClient item={item} images={images} allNoticeGroups={groups} />
}
```

- [ ] **Step 2: Update app/admin/qr/[id]/edit/EditClient.tsx**

Add `allNoticeGroups` prop and the three new panels below the basic info card. Replace the entire file:

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import { TagsPanel } from '@/components/admin/TagsPanel'
import { SectionsPanel } from '@/components/admin/SectionsPanel'
import { NoticePanel } from '@/components/admin/NoticePanel'
import type { QrCodeWithProduct, Product, ProductTag, ProductSection, NoticeGroup } from '@/lib/types'
import type { DriveImage } from '@/lib/drive'

interface EditClientProps {
  item: QrCodeWithProduct
  images: DriveImage[]
  allNoticeGroups: (NoticeGroup & { id: string; name: string })[]
}

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'
const hintClass = 'text-[11px] text-brown-muted font-normal'
const sectionHeadClass =
  'text-sm font-bold tracking-[2px] text-gold uppercase mb-4 pb-3 border-b border-gold/20'

const PREVIEW_SCALE = 0.923
const INNER_W = 390
const INNER_H = 800
const OUTER_W = Math.round(INNER_W * PREVIEW_SCALE)
const OUTER_H = Math.round(INNER_H * PREVIEW_SCALE)

export function EditClient({ item, images, allNoticeGroups }: EditClientProps) {
  const p = item.products

  const [driveUrl, setDriveUrl] = useState(item.drive_folder_url ?? '')
  const [name, setName] = useState(p?.name ?? '')
  const [subtitle, setSubtitle] = useState(p?.subtitle ?? '')
  const [summary, setSummary] = useState(p?.summary ?? '')
  const [idusUrl, setIdusUrl] = useState(p?.idus_url ?? '')

  const [tags, setTags] = useState<(ProductTag & { id: string })[]>(
    (p?.product_tags ?? []) as (ProductTag & { id: string })[]
  )
  const [sections, setSections] = useState<ProductSection[]>(p?.product_sections ?? [])
  const [noticeGroupId, setNoticeGroupId] = useState<string | null>(p?.notice_group_id ?? null)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const previewProduct: Product = {
    id: p?.id ?? '',
    qr_code_id: item.id,
    name: name.trim() || '(제품명)',
    subtitle: subtitle.trim() || null,
    summary: summary.trim() || null,
    idus_url: idusUrl.trim() || null,
    is_active: p?.is_active ?? true,
    product_tags: tags,
    notice_groups: allNoticeGroups.find((g) => g.id === noticeGroupId) ?? p?.notice_groups ?? null,
    product_sections: sections,
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')

    const res = await fetch(`/api/qr/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drive_folder_url: driveUrl.trim() || null,
        name: name.trim(),
        subtitle: subtitle.trim() || null,
        summary: summary.trim() || null,
        idus_url: idusUrl.trim() || null,
      }),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json()
      setError(data.error ?? '저장에 실패했습니다.')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      <nav className="bg-cream border-b border-gold/30 px-8 py-4 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-sm text-brown-light border border-gold/40 rounded-md px-3 py-1.5 hover:bg-gold/10 transition-colors"
            >
              ← 목록
            </Link>
            <div>
              <h1 className="text-base font-bold text-brown-dark">제품 정보 수정</h1>
              <span className="text-xs tracking-[2px] text-gold">EDIT PRODUCT</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-green-600 font-medium">저장되었습니다</span>}
            {error && <span className="text-sm text-red-500">{error}</span>}
            <Link
              href={`/r/${item.slug}`}
              target="_blank"
              className="text-sm text-brown-light border border-gold/40 rounded-lg px-4 py-2 hover:bg-gold/10 transition-colors"
            >
              페이지 보기 →
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm bg-gold text-cream font-bold px-5 py-2 rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-8 py-8">
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* 기본 정보 */}
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className={sectionHeadClass}>기본 정보</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Google Drive 폴더 URL</label>
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className={inputClass}
                  />
                  <p className={`mt-1.5 ${hintClass}`}>변경 시 사진 갤러리가 새 폴더로 교체됩니다.</p>
                </div>
                <div>
                  <label className={labelClass}>
                    제품명 <span className="text-gold">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="레진 갓 키링"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    한 줄 카피 <span className={hintClass}>(제품명 위에 표시)</span>
                  </label>
                  <input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="전통의 아름다움을 일상 속에"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    요약 <span className={hintClass}>(hero 영역 하단 짧은 문단)</span>
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={2}
                    placeholder="제품에 대한 짧은 요약 문장"
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div>
                  <label className={labelClass}>아이디어스 구매 링크</label>
                  <input
                    type="url"
                    value={idusUrl}
                    onChange={(e) => setIdusUrl(e.target.value)}
                    placeholder="https://www.idus.com/v2/product/..."
                    className={inputClass}
                  />
                  <p className={`mt-1.5 ${hintClass}`}>없으면 CTA 버튼이 노출되지 않습니다.</p>
                </div>
              </div>
            </div>

            {/* 태그 */}
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className={sectionHeadClass}>태그</p>
              <TagsPanel
                mode="edit"
                tags={tags}
                qrId={item.id}
                onUpdate={setTags}
              />
            </div>

            {/* 섹션 */}
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className={sectionHeadClass}>섹션</p>
              <SectionsPanel
                mode="edit"
                sections={sections}
                qrId={item.id}
                onUpdate={setSections}
              />
            </div>

            {/* 구매 안내 */}
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className={sectionHeadClass}>구매 안내</p>
              <p className="text-xs text-brown-muted mb-3">
                공유 그룹 항목 수정 시 해당 그룹을 사용하는 모든 제품에 반영됩니다.
              </p>
              <NoticePanel
                mode="edit"
                currentGroupId={noticeGroupId}
                groups={allNoticeGroups}
                qrId={item.id}
                onUpdate={setNoticeGroupId}
              />
            </div>
          </div>

          {/* 오른쪽: 실시간 미리보기 */}
          <div className="w-[400px] flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
                실시간 미리보기
              </p>
              <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
                <div
                  className="relative overflow-hidden rounded-[36px] border-4 border-brown-dark/30 shadow-2xl bg-cream-bg"
                  style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px` }}
                >
                  <div
                    className="absolute top-0 left-0"
                    style={{
                      width: `${INNER_W}px`,
                      height: `${INNER_H}px`,
                      transform: `scale(${PREVIEW_SCALE})`,
                      transformOrigin: 'top left',
                      pointerEvents: 'none',
                    }}
                  >
                    <ProductLandingPage product={previewProduct} images={images} />
                  </div>
                </div>
                <p className="text-xs text-brown-muted text-center mt-2">
                  입력한 내용이 즉시 반영됩니다
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add app/admin/qr/[id]/edit/
git commit -m "feat: add TagsPanel, SectionsPanel, NoticePanel to edit page"
```
