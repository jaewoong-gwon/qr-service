# Content Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모티브·장소 등 공유 가능한 콘텐츠를 `content_library` 테이블에서 관리하고, `product_content_links` 연결 테이블로 여러 제품이 동일 콘텐츠를 공유 참조하도록 한다.

**Architecture:** `closing_templates` / `notice_groups` 패턴과 동일 — 공유 테이블(`content_library`) + 연결 테이블(`product_content_links`). 기존 `product_sections`는 제품 고유 설명 전담으로 유지. 랜딩 페이지 렌더링 순서: product_content_links → product_sections → closing_templates.body.

**Tech Stack:** Next.js 15 App Router, Supabase PostgREST, TypeScript strict, Tailwind CSS v4, Vitest + Testing Library

---

## File Map

| 상태 | 파일 |
|------|------|
| 신규 | `supabase/migrations/20260618000001_add_content_library.sql` |
| 수정 | `lib/types.ts` |
| 신규 | `app/api/content-library/route.ts` |
| 신규 | `app/api/qr/[id]/content-links/route.ts` |
| 신규 | `app/api/qr/[id]/content-links/[linkId]/route.ts` |
| 수정 | `app/api/qr/route.ts` |
| 수정 | `components/ProductLandingPage.tsx` |
| 신규 | `components/admin/ContentLibraryPanel.tsx` |
| 수정 | `app/r/[slug]/page.tsx` |
| 수정 | `app/admin/qr/[id]/edit/page.tsx` |
| 수정 | `app/admin/qr/[id]/edit/EditClient.tsx` |
| 수정 | `app/admin/qr/new/page.tsx` |
| 수정 | `__tests__/components/ProductLandingPage.test.tsx` |
| 신규 | `__tests__/components/admin/ContentLibraryPanel.test.tsx` |

---

## Task 1: Migration SQL

**Files:**
- Create: `supabase/migrations/20260618000001_add_content_library.sql`

- [ ] **Step 1: Write migration file**

```sql
-- supabase/migrations/20260618000001_add_content_library.sql

CREATE TABLE IF NOT EXISTS content_library (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body  text NOT NULL
);

CREATE TABLE IF NOT EXISTS product_content_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content_library(id) ON DELETE CASCADE,
  sort_order int  NOT NULL DEFAULT 0,
  CONSTRAINT uq_product_content UNIQUE (product_id, content_id)
);
```

- [ ] **Step 2: 수동 실행 — Supabase 대시보드 SQL Editor에서 위 SQL 붙여넣고 실행**

- [ ] **Step 3: 실행 확인 쿼리 (SQL Editor)**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('content_library', 'product_content_links');
-- 결과: 2개 row가 나타나야 함
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260618000001_add_content_library.sql
git commit -m "feat: add content_library and product_content_links migration"
```

---

## Task 2: Type Definitions

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: `lib/types.ts`를 열어 현재 내용 확인 후 아래 내용으로 교체**

```typescript
// lib/types.ts — FINAL

export interface Store {
  id: string
  admin_id: string
  name: string
  slug: string
  created_at: string
}

export interface QrCode {
  id: string
  slug: string
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

export interface ClosingTemplate {
  id: string
  name: string
  body: string
}

export interface ContentLibraryItem {
  id: string
  title: string
  body: string
}

export interface ProductContentLink {
  id: string
  sort_order: number
  content_library: ContentLibraryItem
}

export interface ProductTag {
  id?: string
  label: string
  sort_order: number
}

export type SectionType = 'meaning'

export interface ProductSection {
  id: string
  section_type: SectionType
  title: string | null
  body: string | null
  sort_order: number
}

export interface Product {
  id: string
  qr_code_id: string
  store_id: string | null
  name: string
  subtitle: string | null
  idus_url: string | null
  is_active: boolean
  notice_group_id?: string | null
  closing_template_id?: string | null
  product_tags?: ProductTag[]
  notice_groups?: NoticeGroup | null
  closing_templates?: ClosingTemplate | null
  product_sections?: ProductSection[]
  product_content_links?: ProductContentLink[]
}

export interface QrCodeWithProduct extends QrCode {
  products: Product | null
}
```

- [ ] **Step 2: TypeScript 컴파일 오류 없는지 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음 (또는 types.ts 변경 전과 동일한 오류만)

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add ContentLibraryItem and ProductContentLink types"
```

---

## Task 3: API — `GET /api/content-library` 및 `POST /api/content-library`

**Files:**
- Create: `app/api/content-library/route.ts`

이 API는 `closing-templates/route.ts`와 동일한 패턴을 따른다.

- [ ] **Step 1: `app/api/content-library/route.ts` 작성**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getAdminId } from '@/lib/auth'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('content_library')
    .select('id, title, body')
    .order('title')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const adminId = await getAdminId(request)
  if (!adminId) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { title, body } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: '제목을 입력해주세요' }, { status: 400 })
  if (!body?.trim()) return NextResponse.json({ error: '설명을 입력해주세요' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('content_library')
    .insert({ title: title.trim(), body: body.trim() })
    .select('id, title, body')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
git add app/api/content-library/route.ts
git commit -m "feat: add GET/POST /api/content-library route"
```

---

## Task 4: API — `POST /api/qr/[id]/content-links`

**Files:**
- Create: `app/api/qr/[id]/content-links/route.ts`

`product_id`는 `qr_code_id`로 products 테이블에서 조회한다 (sections route와 동일한 방식).

- [ ] **Step 1: `app/api/qr/[id]/content-links/route.ts` 작성**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getAdminId } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAdminId(request)
  if (!adminId) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id } = await params
  const { content_id, sort_order = 0 } = await request.json()

  if (!content_id) {
    return NextResponse.json({ error: 'content_id가 필요합니다' }, { status: 400 })
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
    .from('product_content_links')
    .insert({ product_id: product.id, content_id, sort_order })
    .select('id, sort_order, content_library ( id, title, body )')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 연결된 항목입니다' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
git add app/api/qr/[id]/content-links/route.ts
git commit -m "feat: add POST /api/qr/[id]/content-links route"
```

---

## Task 5: API — `DELETE/PATCH /api/qr/[id]/content-links/[linkId]`

**Files:**
- Create: `app/api/qr/[id]/content-links/[linkId]/route.ts`

`sections/[sid]/route.ts`와 동일한 패턴.

- [ ] **Step 1: `app/api/qr/[id]/content-links/[linkId]/route.ts` 작성**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getAdminId } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const adminId = await getAdminId(request)
  if (!adminId) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { linkId } = await params
  const { sort_order } = await request.json()

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('product_content_links')
    .update({ sort_order })
    .eq('id', linkId)
    .select('id, sort_order, content_library ( id, title, body )')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const adminId = await getAdminId(request)
  if (!adminId) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { linkId } = await params
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from('product_content_links').delete().eq('id', linkId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
git add app/api/qr/[id]/content-links/[linkId]/route.ts
git commit -m "feat: add DELETE/PATCH /api/qr/[id]/content-links/[linkId] route"
```

---

## Task 6: Update QR Creation API (`POST /api/qr`)

**Files:**
- Modify: `app/api/qr/route.ts`

QR 생성 시 `content_links` 배열을 처리한다. 항목마다 `new_content` 이면 `content_library` INSERT 후 링크 생성, `content_id`이면 바로 링크 생성.

- [ ] **Step 1: `app/api/qr/route.ts` 상단 인터페이스 및 본문 수정**

`app/api/qr/route.ts`의 전체 내용을 아래로 교체한다:

```typescript
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
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
git add app/api/qr/route.ts
git commit -m "feat: handle content_links in QR creation POST API"
```

---

## Task 7: ProductLandingPage — content_links 렌더링

**Files:**
- Modify: `components/ProductLandingPage.tsx`
- Modify: `__tests__/components/ProductLandingPage.test.tsx`

`product_content_links`를 `product_sections`보다 먼저 렌더링한다. 각 링크를 `ProductSection` 형태로 변환해 기존 `SectionCard`를 재사용한다.

- [ ] **Step 1: 실패하는 테스트 먼저 작성**

`__tests__/components/ProductLandingPage.test.tsx`의 `base` 객체와 테스트를 아래로 교체한다. 기존 테스트는 모두 유지하고, `base`에 `product_content_links` 추가, 새 테스트 2개 추가:

```typescript
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import type { Product } from '@/lib/types'

const base: Product = {
  id: 'p1',
  qr_code_id: 'qr1',
  store_id: null,
  name: '레진 갓 키링',
  subtitle: '전통의 아름다움을 일상 속에',
  idus_url: 'https://www.idus.com/v2/product/abc',
  is_active: true,
  closing_template_id: 'ct1',
  closing_templates: {
    id: 'ct1',
    name: '레진 키링 마무리',
    body: '작지만 오래 간직할 수 있는 전통의 가치',
  },
  product_tags: [
    { label: '핸드메이드', sort_order: 0 },
    { label: '전통 소품', sort_order: 1 },
  ],
  notice_groups: {
    notice_group_items: [
      { content: '핸드메이드 제품으로 색상·크기에 차이가 있습니다', sort_order: 0 },
    ],
  },
  product_sections: [
    {
      id: 's1',
      section_type: 'meaning',
      title: '갓의 의미',
      body: '한국 전통 갓의 우아한 선을 담았습니다.',
      sort_order: 0,
    },
  ],
  product_content_links: [
    {
      id: 'pcl1',
      sort_order: 0,
      content_library: { id: 'cl1', title: '훈민정음', body: '세종대왕이 창제한 한국의 문자 체계' },
    },
  ],
}

describe('ProductLandingPage', () => {
  it('제품명이 h1으로 표시된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByRole('heading', { name: '레진 갓 키링' })).toBeInTheDocument()
  })

  it('subtitle이 표시된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByText('전통의 아름다움을 일상 속에')).toBeInTheDocument()
  })

  it('product_tags가 pill로 표시된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByText('핸드메이드')).toBeInTheDocument()
    expect(screen.getByText('전통 소품')).toBeInTheDocument()
  })

  it('구매 전 확인사항이 섹션보다 먼저 표시된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByText('구매 전 확인사항')).toBeInTheDocument()
    expect(
      screen.getByText('핸드메이드 제품으로 색상·크기에 차이가 있습니다')
    ).toBeInTheDocument()
  })

  it('meaning 섹션이 렌더링된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByText('갓의 의미')).toBeInTheDocument()
    expect(screen.getByText('한국 전통 갓의 우아한 선을 담았습니다.')).toBeInTheDocument()
  })

  it('idus_url이 있으면 아이디어스 링크가 표시된다', () => {
    render(<ProductLandingPage product={base} />)
    const link = screen.getByRole('link', { name: /아이디어스 작품 페이지 보기/ })
    expect(link).toHaveAttribute('href', 'https://www.idus.com/v2/product/abc')
  })

  it('idus_url이 없으면 아이디어스 링크가 없다', () => {
    render(<ProductLandingPage product={{ ...base, idus_url: null }} />)
    expect(screen.queryByRole('link', { name: /작품 페이지 보기/ })).not.toBeInTheDocument()
  })

  it('notice_groups가 없으면 구매 전 확인사항이 없다', () => {
    render(<ProductLandingPage product={{ ...base, notice_groups: null }} />)
    expect(screen.queryByText('구매 전 확인사항')).not.toBeInTheDocument()
  })

  it('product가 null이면 기본 문구가 표시된다', () => {
    render(<ProductLandingPage product={null} />)
    expect(screen.getByText('제품 정보 없음')).toBeInTheDocument()
  })

  it('closing_templates.body가 렌더링된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByText('작지만 오래 간직할 수 있는 전통의 가치')).toBeInTheDocument()
  })

  it('closing_templates가 없으면 마무리 문구가 없다', () => {
    render(<ProductLandingPage product={{ ...base, closing_templates: null }} />)
    expect(screen.queryByText('작지만 오래 간직할 수 있는 전통의 가치')).not.toBeInTheDocument()
  })

  it('product_content_links의 title과 body가 렌더링된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByText('훈민정음')).toBeInTheDocument()
    expect(screen.getByText('세종대왕이 창제한 한국의 문자 체계')).toBeInTheDocument()
  })

  it('product_content_links가 없으면 추가 콘텐츠가 없다', () => {
    render(<ProductLandingPage product={{ ...base, product_content_links: [] }} />)
    expect(screen.queryByText('훈민정음')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run __tests__/components/ProductLandingPage.test.tsx
```

Expected: `product_content_links의 title과 body가 렌더링된다` 테스트 FAIL

- [ ] **Step 3: `components/ProductLandingPage.tsx` 수정**

```typescript
import type { Product, ProductSection } from '@/lib/types'
import { SectionCard } from '@/components/sections/SectionCard'

interface ProductLandingPageProps {
  product: Product | null
}

export function ProductLandingPage({ product }: ProductLandingPageProps) {
  if (!product) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center">
        <p className="text-brown-mid">제품 정보 없음</p>
      </div>
    )
  }

  const noticeItems = (product.notice_groups?.notice_group_items ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  const tags = (product.product_tags ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  // product_content_links를 SectionCard 형태로 변환 (sort_order 오름차순)
  const contentLinkSections: ProductSection[] = (product.product_content_links ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((link) => ({
      id: link.id,
      section_type: 'meaning' as const,
      title: link.content_library.title,
      body: link.content_library.body,
      sort_order: link.sort_order,
    }))

  const sections = (product.product_sections ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  const closingBody = product.closing_templates?.body ?? null

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Hero */}
      <div className="bg-cream px-5 pt-8 pb-6 text-center">
        {product.subtitle && (
          <p className="text-[10px] text-brown-muted tracking-[1.5px] uppercase font-medium mb-2">{product.subtitle}</p>
        )}
        <h1 className="text-[28px] font-black text-brown-dark leading-[1.15] tracking-[-0.5px]">
          {product.name}
        </h1>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className="text-[11px] font-semibold text-brown-mid bg-cream-bg px-3 py-[5px] rounded-full border border-gold/30"
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* 구매 전 확인사항 — 최상단 우선 노출 */}
        {noticeItems.length > 0 && (
          <div className="bg-gold/[0.07] border border-gold/20 border-l-[3px] border-l-gold rounded-xl px-4 py-4">
            <p className="text-[13px] font-bold text-brown-dark mb-3 flex items-center gap-1.5">
              <span aria-hidden="true">📋</span> 구매 전 확인사항
            </p>
            <ul className="flex flex-col gap-2.5">
              {noticeItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-gold flex-shrink-0 mt-0.5 flex items-center justify-center text-[8px] text-cream font-bold">
                    ✓
                  </span>
                  <span className="text-[13px] text-brown-dark leading-[1.65]">{item.content}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 공유 콘텐츠 (content_library 연결 항목) — product_sections보다 먼저 */}
        {contentLinkSections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}

        {/* 제품 고유 섹션 (meaning 타입) */}
        {sections.map((section) => {
          if (!section.title && !section.body) return null
          return <SectionCard key={section.id} section={section} />
        })}

        {/* 마무리 문구 — closing_template에서 고정 출력 */}
        {closingBody && (
          <div className="bg-cream rounded-2xl px-5 py-6 text-center">
            <p className="text-[17px] font-bold text-brown-dark leading-[1.7]">
              {closingBody}
            </p>
          </div>
        )}

        {/* 아이디어스 CTA */}
        {product.idus_url && (
          <div className="bg-brown-dark/5 rounded-2xl px-5 py-5">
            <p className="text-[13px] text-brown-dark leading-[1.75] mb-4">
              더 많은 작품 사진과 자세한 설명은{' '}
              <span className="text-gold font-semibold">아이디어스</span>에서 확인하실 수 있습니다.
            </p>
            <a
              href={product.idus_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-brown-dark text-cream text-center font-bold py-4 rounded-xl text-sm tracking-wide hover:opacity-90 transition-opacity"
            >
              아이디어스 작품 페이지 보기 →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/components/ProductLandingPage.test.tsx
```

Expected: 전체 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add components/ProductLandingPage.tsx __tests__/components/ProductLandingPage.test.tsx
git commit -m "feat: render product_content_links before product_sections in landing page"
```

---

## Task 8: ContentLibraryPanel 컴포넌트

**Files:**
- Create: `components/admin/ContentLibraryPanel.tsx`
- Create: `__tests__/components/admin/ContentLibraryPanel.test.tsx`

`SectionsPanel` / `ClosingTemplatePanel`과 동일한 create/edit 이중 모드 패턴.

- [ ] **Step 1: 실패하는 테스트 먼저 작성**

`__tests__/components/admin/ContentLibraryPanel.test.tsx` 생성:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContentLibraryPanel } from '@/components/admin/ContentLibraryPanel'
import type { ContentLibraryItem, ProductContentLink } from '@/lib/types'

const mockLibrary: ContentLibraryItem[] = [
  { id: 'cl1', title: '훈민정음', body: '세종대왕이 창제한 문자 체계' },
  { id: 'cl2', title: '달항아리', body: '조선 백자의 대표 작품' },
]

const mockLinks: ProductContentLink[] = [
  { id: 'pcl1', sort_order: 0, content_library: { id: 'cl1', title: '훈민정음', body: '세종대왕이 창제한 문자 체계' } },
]

describe('ContentLibraryPanel (create mode)', () => {
  it('라이브러리 드롭다운이 렌더링된다', () => {
    render(
      <ContentLibraryPanel
        mode="create"
        contentLinks={[]}
        contentLibrary={mockLibrary}
        onChange={() => {}}
      />
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('훈민정음')).toBeInTheDocument()
    expect(screen.getByText('달항아리')).toBeInTheDocument()
  })

  it('드롭다운에서 항목 선택 시 onChange가 content_id로 호출된다', () => {
    const onChange = vi.fn()
    render(
      <ContentLibraryPanel
        mode="create"
        contentLinks={[]}
        contentLibrary={mockLibrary}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'cl1' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content_id: 'cl1', new_content: null }),
      ])
    )
  })

  it('새 항목 만들기 버튼 클릭 시 폼이 나타난다', () => {
    render(
      <ContentLibraryPanel
        mode="create"
        contentLinks={[]}
        contentLibrary={mockLibrary}
        onChange={() => {}}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '새 항목 만들기' }))
    expect(screen.getByPlaceholderText('제목 (예: 훈민정음, 달항아리)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('설명을 입력하세요')).toBeInTheDocument()
  })

  it('새 항목 확인 시 onChange가 new_content로 호출된다', () => {
    const onChange = vi.fn()
    render(
      <ContentLibraryPanel
        mode="create"
        contentLinks={[]}
        contentLibrary={mockLibrary}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '새 항목 만들기' }))
    fireEvent.change(screen.getByPlaceholderText('제목 (예: 훈민정음, 달항아리)'), {
      target: { value: '경복궁' },
    })
    fireEvent.change(screen.getByPlaceholderText('설명을 입력하세요'), {
      target: { value: '조선의 법궁' },
    })
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content_id: null, new_content: { title: '경복궁', body: '조선의 법궁' } }),
      ])
    )
  })

  it('연결된 항목 목록이 표시되고 해제 버튼이 있다', () => {
    render(
      <ContentLibraryPanel
        mode="create"
        contentLinks={[{ content_id: 'cl1', new_content: null, sort_order: 0 }]}
        contentLibrary={mockLibrary}
        onChange={() => {}}
      />
    )
    expect(screen.getByText('훈민정음')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '해제' })).toBeInTheDocument()
  })

  it('해제 버튼 클릭 시 onChange가 빈 배열로 호출된다', () => {
    const onChange = vi.fn()
    render(
      <ContentLibraryPanel
        mode="create"
        contentLinks={[{ content_id: 'cl1', new_content: null, sort_order: 0 }]}
        contentLibrary={mockLibrary}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '해제' }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})

describe('ContentLibraryPanel (edit mode)', () => {
  it('현재 연결된 항목이 표시된다', () => {
    render(
      <ContentLibraryPanel
        mode="edit"
        contentLinks={mockLinks}
        contentLibrary={mockLibrary}
        qrId="qr1"
        onUpdate={() => {}}
      />
    )
    expect(screen.getByText('훈민정음')).toBeInTheDocument()
  })

  it('해제 버튼이 렌더링된다', () => {
    render(
      <ContentLibraryPanel
        mode="edit"
        contentLinks={mockLinks}
        contentLibrary={mockLibrary}
        qrId="qr1"
        onUpdate={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: '해제' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run __tests__/components/admin/ContentLibraryPanel.test.tsx
```

Expected: FAIL (컴포넌트 없음)

- [ ] **Step 3: `components/admin/ContentLibraryPanel.tsx` 작성**

```typescript
'use client'

import { useState } from 'react'
import type { ContentLibraryItem, ProductContentLink } from '@/lib/types'

export interface ContentLinkFormData {
  content_id: string | null
  new_content: { title: string; body: string } | null
  sort_order: number
}

interface ContentLibraryPanelCreateProps {
  mode: 'create'
  contentLinks: ContentLinkFormData[]
  contentLibrary: ContentLibraryItem[]
  onChange: (links: ContentLinkFormData[]) => void
}

interface ContentLibraryPanelEditProps {
  mode: 'edit'
  contentLinks: ProductContentLink[]
  contentLibrary: ContentLibraryItem[]
  qrId: string
  onUpdate: (links: ProductContentLink[]) => void
  onContentLibraryChange?: (library: ContentLibraryItem[]) => void
}

export type ContentLibraryPanelProps = ContentLibraryPanelCreateProps | ContentLibraryPanelEditProps

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const selectClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold'

export function ContentLibraryPanel(props: ContentLibraryPanelProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [loading, setLoading] = useState(false)

  // create 모드: 이미 연결된 content_id 목록 (중복 방지용)
  const usedContentIds =
    props.mode === 'create'
      ? props.contentLinks.map((l) => l.content_id).filter(Boolean) as string[]
      : props.contentLinks.map((l) => l.content_library.id)

  // create 모드: content_id로 제목 조회
  function resolveTitle(link: ContentLinkFormData): string {
    if (link.new_content) return link.new_content.title
    const item = props.contentLibrary.find((c) => c.id === link.content_id)
    return item?.title ?? link.content_id ?? ''
  }

  function handleDropdownSelect(contentId: string) {
    if (!contentId) return
    if (props.mode === 'create') {
      const next: ContentLinkFormData = { content_id: contentId, new_content: null, sort_order: props.contentLinks.length }
      props.onChange([...props.contentLinks, next])
    }
    // edit 모드 드롭다운 선택은 별도 핸들러
  }

  async function handleDropdownSelectEdit(contentId: string) {
    if (!contentId || props.mode !== 'edit') return
    setLoading(true)
    const res = await fetch(`/api/qr/${props.qrId}/content-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: contentId, sort_order: props.contentLinks.length }),
    })
    if (res.ok) {
      const data: ProductContentLink = await res.json()
      props.onUpdate([...props.contentLinks, data])
    }
    setLoading(false)
  }

  function removeCreate(index: number) {
    if (props.mode !== 'create') return
    const next = props.contentLinks.filter((_, i) => i !== index)
      .map((l, i) => ({ ...l, sort_order: i }))
    props.onChange(next)
  }

  async function removeEdit(link: ProductContentLink) {
    if (props.mode !== 'edit') return
    setLoading(true)
    await fetch(`/api/qr/${props.qrId}/content-links/${link.id}`, { method: 'DELETE' })
    props.onUpdate(props.contentLinks.filter((l) => l.id !== link.id)
      .map((l, i) => ({ ...l, sort_order: i })))
    setLoading(false)
  }

  function moveCreate(index: number, direction: -1 | 1) {
    if (props.mode !== 'create') return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= props.contentLinks.length) return
    const next = [...props.contentLinks]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    next.forEach((l, i) => { l.sort_order = i })
    props.onChange(next)
  }

  async function moveEdit(index: number, direction: -1 | 1) {
    if (props.mode !== 'edit') return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= props.contentLinks.length) return
    const next = [...props.contentLinks]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    next.forEach((l, i) => { l.sort_order = i })
    props.onUpdate(next)
    setLoading(true)
    await Promise.all([
      fetch(`/api/qr/${props.qrId}/content-links/${next[index].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: next[index].sort_order }),
      }),
      fetch(`/api/qr/${props.qrId}/content-links/${next[targetIndex].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: next[targetIndex].sort_order }),
      }),
    ])
    setLoading(false)
  }

  async function confirmNew() {
    if (!newTitle.trim() || !newBody.trim()) return

    if (props.mode === 'create') {
      const next: ContentLinkFormData = {
        content_id: null,
        new_content: { title: newTitle.trim(), body: newBody.trim() },
        sort_order: props.contentLinks.length,
      }
      props.onChange([...props.contentLinks, next])
      setNewTitle('')
      setNewBody('')
      setShowNewForm(false)
      return
    }

    setLoading(true)
    const itemRes = await fetch('/api/content-library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), body: newBody.trim() }),
    })
    if (!itemRes.ok) { setLoading(false); return }
    const newItem: ContentLibraryItem = await itemRes.json()

    const linkRes = await fetch(`/api/qr/${props.qrId}/content-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: newItem.id, sort_order: props.contentLinks.length }),
    })
    if (linkRes.ok) {
      const data: ProductContentLink = await linkRes.json()
      props.onUpdate([...props.contentLinks, data])
      props.onContentLibraryChange?.([...props.contentLibrary, newItem])
    }
    setNewTitle('')
    setNewBody('')
    setShowNewForm(false)
    setLoading(false)
  }

  // 드롭다운에서 이미 연결된 항목 제외
  const availableLibrary = props.contentLibrary.filter((c) => !usedContentIds.includes(c.id))

  return (
    <div className="flex flex-col gap-3">
      {/* 드롭다운 + 새 항목 버튼 (폼 열렸을 때 숨김) */}
      {!showNewForm && (
        <>
          <div className="flex gap-2">
            <select
              value=""
              onChange={(e) => {
                if (props.mode === 'create') handleDropdownSelect(e.target.value)
                else handleDropdownSelectEdit(e.target.value)
                e.target.value = ''
              }}
              className={selectClass}
              disabled={loading}
            >
              <option value="">라이브러리에서 선택</option>
              {availableLibrary.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              className="flex-shrink-0 text-xs px-3 py-2 border border-gold/40 rounded-lg text-brown-mid hover:bg-gold/10 whitespace-nowrap"
            >
              새 항목 만들기
            </button>
          </div>
        </>
      )}

      {/* 새 항목 폼 */}
      {showNewForm && (
        <div className="border border-gold/30 rounded-lg p-4 bg-white flex flex-col gap-3">
          <p className="text-xs font-bold text-brown-dark">새 콘텐츠 항목</p>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="제목 (예: 훈민정음, 달항아리)"
            className={inputClass}
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="설명을 입력하세요"
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmNew}
              disabled={!newTitle.trim() || !newBody.trim() || loading}
              className="px-4 py-2 text-sm bg-gold text-cream rounded-lg hover:bg-gold/90 disabled:opacity-50"
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => { setShowNewForm(false); setNewTitle(''); setNewBody('') }}
              className="px-4 py-2 text-sm border border-gold/40 rounded-lg text-brown-light hover:bg-gold/10"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 연결된 항목 목록 */}
      {props.mode === 'create' && props.contentLinks.length > 0 && (
        <div className="flex flex-col gap-2">
          {props.contentLinks.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2 border border-gold/20 rounded-lg px-3 py-2 bg-white">
              <span className="flex-1 text-sm text-brown-dark">{resolveTitle(link)}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveCreate(idx, -1)}
                  disabled={idx === 0}
                  className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveCreate(idx, 1)}
                  disabled={idx === props.contentLinks.length - 1}
                  className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeCreate(idx)}
                  className="px-2 py-1 text-xs border border-red-200 rounded text-red-400 hover:bg-red-50"
                >
                  해제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {props.mode === 'edit' && props.contentLinks.length > 0 && (
        <div className="flex flex-col gap-2">
          {props.contentLinks.map((link, idx) => (
            <div key={link.id} className="flex items-center gap-2 border border-gold/20 rounded-lg px-3 py-2 bg-white">
              <span className="flex-1 text-sm text-brown-dark">{link.content_library.title}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveEdit(idx, -1)}
                  disabled={idx === 0 || loading}
                  className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveEdit(idx, 1)}
                  disabled={idx === props.contentLinks.length - 1 || loading}
                  className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeEdit(link)}
                  disabled={loading}
                  className="px-2 py-1 text-xs border border-red-200 rounded text-red-400 hover:bg-red-50 disabled:opacity-30"
                >
                  해제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/components/admin/ContentLibraryPanel.test.tsx
```

Expected: 전체 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add components/admin/ContentLibraryPanel.tsx __tests__/components/admin/ContentLibraryPanel.test.tsx
git commit -m "feat: add ContentLibraryPanel component with create/edit modes"
```

---

## Task 9: Supabase 쿼리 업데이트

**Files:**
- Modify: `app/r/[slug]/page.tsx`
- Modify: `app/admin/qr/[id]/edit/page.tsx`

두 곳에서 Supabase select 쿼리에 `product_content_links` 조인을 추가하고, edit page에서는 `content_library` 전체 목록도 fetch한다.

- [ ] **Step 1: `app/r/[slug]/page.tsx` 수정 — 쿼리에 product_content_links 추가**

```typescript
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import type { Product } from '@/lib/types'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServerSupabaseClient()

  const { data: qrCode, error } = await supabase
    .from('qr_codes')
    .select(`
      *,
      products (
        *,
        product_tags ( label, sort_order ),
        notice_groups ( notice_group_items ( content, sort_order ) ),
        closing_templates ( id, name, body ),
        product_sections ( * ),
        product_content_links ( id, sort_order, content_library ( id, title, body ) )
      )
    `)
    .eq('slug', slug)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  if (!qrCode) notFound()

  // PostgREST returns one-to-many as array; take first element
  const raw = qrCode as any
  const product = (Array.isArray(raw.products) ? raw.products[0] ?? null : raw.products) as Product | null

  return <ProductLandingPage product={product} />
}
```

- [ ] **Step 2: `app/admin/qr/[id]/edit/page.tsx` 수정 — 쿼리 + content_library fetch 추가**

```typescript
import { createServerSupabaseClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { EditClient } from './EditClient'
import type { QrCodeWithProduct, NoticeGroup, Store, ClosingTemplate, ContentLibraryItem } from '@/lib/types'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerSupabaseClient()

  const [
    { data, error },
    { data: allGroups },
    { data: allStores },
    { data: allClosingTemplates },
    { data: allContentLibrary },
  ] = await Promise.all([
    supabase
      .from('qr_codes')
      .select(`
        *,
        products (
          *,
          product_tags ( id, label, sort_order ),
          notice_groups ( id, name, notice_group_items ( id, content, sort_order ) ),
          closing_templates ( id, name, body ),
          product_sections ( * ),
          product_content_links ( id, sort_order, content_library ( id, title, body ) )
        )
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('notice_groups')
      .select('id, name, notice_group_items ( id, content, sort_order )')
      .order('name'),
    supabase
      .from('stores')
      .select('id, name, slug, created_at, admin_id')
      .order('created_at', { ascending: true }),
    supabase
      .from('closing_templates')
      .select('id, name, body')
      .order('name'),
    supabase
      .from('content_library')
      .select('id, title, body')
      .order('title'),
  ])

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  if (!data) notFound()

  // PostgREST returns one-to-many as array; take first element
  const raw = data as any
  const item: QrCodeWithProduct = {
    ...raw,
    products: Array.isArray(raw.products) ? (raw.products[0] ?? null) : raw.products,
  }
  const groups = (allGroups ?? []) as unknown as (NoticeGroup & { id: string; name: string })[]
  const stores = (allStores ?? []) as unknown as Store[]
  const closingTemplates = (allClosingTemplates ?? []) as ClosingTemplate[]
  const contentLibrary = (allContentLibrary ?? []) as ContentLibraryItem[]

  return (
    <EditClient
      item={item}
      allNoticeGroups={groups}
      stores={stores}
      closingTemplates={closingTemplates}
      contentLibrary={contentLibrary}
    />
  )
}
```

- [ ] **Step 3: TypeScript 오류 확인 (EditClient props 불일치가 나타날 것 — Task 11에서 해결)**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: `EditClient`의 `contentLibrary` prop 관련 오류가 나타남 (Task 11에서 수정)

- [ ] **Step 4: Commit**

```bash
git add app/r/[slug]/page.tsx app/admin/qr/[id]/edit/page.tsx
git commit -m "feat: add product_content_links to Supabase queries"
```

---

## Task 10: New QR Page — ContentLibraryPanel 추가

**Files:**
- Modify: `app/admin/qr/new/page.tsx`

- [ ] **Step 1: `app/admin/qr/new/page.tsx` 수정**

기존 import에 `ContentLibraryPanel` 및 관련 타입 추가, state 추가, useEffect에 content_library fetch 추가, previewProduct에 product_content_links 추가, handleCreate body에 content_links 추가, 섹션 탭에 ContentLibraryPanel 추가.

`app/admin/qr/new/page.tsx`의 전체 내용을 아래로 교체:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import { Step1Basic, type BasicData } from './steps/Step1Basic'
import { TagsPanel } from '@/components/admin/TagsPanel'
import { SectionsPanel } from '@/components/admin/SectionsPanel'
import { NoticePanel } from '@/components/admin/NoticePanel'
import { ClosingTemplatePanel, type ClosingFormData } from '@/components/admin/ClosingTemplatePanel'
import { ContentLibraryPanel, type ContentLinkFormData } from '@/components/admin/ContentLibraryPanel'
import { SaveCompleteModal } from '@/components/admin/SaveCompleteModal'
import type { NoticeFormData } from '@/components/admin/NoticePanel'
import type {
  Product, ProductTag, ProductSection, NoticeGroup,
  Store, ClosingTemplate, ContentLibraryItem, ProductContentLink,
} from '@/lib/types'

const PREVIEW_SCALE = 0.923
const INNER_W = 390
const BORDER_W = 4
const OUTER_W = Math.round(INNER_W * PREVIEW_SCALE) + BORDER_W * 2
const OUTER_H = Math.round(800 * PREVIEW_SCALE) + BORDER_W * 2

const TABS = ['기본 정보', '구매 안내', '태그', '섹션'] as const
type Tab = (typeof TABS)[number]

const INITIAL_BASIC: BasicData = { name: '', subtitle: '', idusUrl: '', storeId: '' }

export default function NewQrPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('기본 정보')
  const [basic, setBasic] = useState<BasicData>(INITIAL_BASIC)
  const [stores, setStores] = useState<Store[]>([])
  const [tags, setTags] = useState<ProductTag[]>([])
  const [sections, setSections] = useState<ProductSection[]>([])
  const [noticeData, setNoticeData] = useState<NoticeFormData | null>(null)
  const [noticeGroups, setNoticeGroups] = useState<(NoticeGroup & { id: string; name: string })[]>([])
  const [closingTemplates, setClosingTemplates] = useState<ClosingTemplate[]>([])
  const [closingData, setClosingData] = useState<ClosingFormData | null>(null)
  const [contentLibrary, setContentLibrary] = useState<ContentLibraryItem[]>([])
  const [contentLinks, setContentLinks] = useState<ContentLinkFormData[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [previewFocused, setPreviewFocused] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/notice-groups').then((r) => r.json()),
      fetch('/api/stores').then((r) => r.json()),
      fetch('/api/closing-templates').then((r) => r.json()),
      fetch('/api/content-library').then((r) => r.json()),
    ]).then(([groups, storeList, templates, library]) => {
      if (Array.isArray(groups)) setNoticeGroups(groups)
      if (Array.isArray(storeList)) setStores(storeList)
      if (Array.isArray(templates)) setClosingTemplates(templates)
      if (Array.isArray(library)) setContentLibrary(library)
    }).catch((err) => console.error('Failed to load data:', err))
  }, [])

  const canCreate = basic.name.trim() !== '' && basic.storeId !== ''

  // create 모드: ContentLinkFormData → ProductContentLink 형태로 변환 (preview 용)
  const previewContentLinks: ProductContentLink[] = contentLinks
    .filter((l) => l.content_id || l.new_content)
    .map((l, i) => {
      const lib = l.content_id
        ? contentLibrary.find((c) => c.id === l.content_id)
        : null
      return {
        id: `preview-${i}`,
        sort_order: l.sort_order,
        content_library: lib ?? {
          id: '',
          title: l.new_content?.title ?? '',
          body: l.new_content?.body ?? '',
        },
      }
    })

  const previewProduct: Product = {
    id: '',
    qr_code_id: '',
    store_id: basic.storeId || null,
    name: basic.name.trim() || '(제품명)',
    subtitle: basic.subtitle.trim() || null,
    idus_url: basic.idusUrl.trim() || null,
    is_active: true,
    product_tags: tags,
    product_sections: sections,
    product_content_links: previewContentLinks,
    notice_groups:
      noticeData?.mode === 'new' && noticeData.newGroup
        ? {
            notice_group_items: noticeData.newGroup.items.map((item, i) => ({
              content: item.content,
              sort_order: i,
            })),
          }
        : noticeData?.mode === 'existing' && noticeData.groupId
          ? (noticeGroups.find((g) => g.id === noticeData.groupId) ?? null)
          : null,
    closing_template_id: closingData?.mode === 'existing' ? closingData.templateId : null,
    closing_templates:
      closingData?.mode === 'existing' && closingData.templateId
        ? (closingTemplates.find((t) => t.id === closingData.templateId) ?? null)
        : closingData?.mode === 'new' && closingData.newTemplate
          ? { id: '', name: closingData.newTemplate.name, body: closingData.newTemplate.body }
          : null,
  }

  async function handleCreate() {
    setLoading(true)
    setError('')
    const body = {
      name: basic.name.trim(),
      subtitle: basic.subtitle.trim() || null,
      idus_url: basic.idusUrl.trim() || null,
      store_id: basic.storeId || null,
      tags: tags.map((t, i) => ({ label: t.label, sort_order: i })),
      sections: sections.map((s, i) => ({
        section_type: s.section_type,
        title: s.title,
        body: s.body,
        sort_order: i,
      })),
      notice: noticeData
        ? {
            group_id: noticeData.mode === 'existing' ? noticeData.groupId : null,
            new_group: noticeData.mode === 'new' ? noticeData.newGroup : null,
          }
        : null,
      closing: closingData
        ? {
            template_id: closingData.mode === 'existing' ? closingData.templateId : null,
            new_template: closingData.mode === 'new' ? closingData.newTemplate : null,
          }
        : null,
      content_links: contentLinks.map((l, i) => ({
        content_id: l.content_id,
        new_content: l.new_content,
        sort_order: i,
      })),
    }
    const res = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      setCreatedId(data.id)
      setShowModal(true)
    } else {
      const data = await res.json()
      setError(data.error ?? '생성에 실패했습니다.')
    }
    setLoading(false)
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
          <div className="flex items-center gap-1.5">
            {TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  tab === t
                    ? 'bg-gold text-cream font-bold'
                    : 'text-brown-light border border-gold/30 hover:bg-gold/10'
                }`}
              >
                {i + 1}. {t}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-end gap-1">
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={!canCreate || loading}
              className="text-sm bg-gold text-cream font-bold px-5 py-2 rounded-lg hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '생성 중...' : 'QR 생성'}
            </button>
            {!canCreate && (
              <p className="text-[10px] text-brown-muted">매장·제품명 선택 후 활성화</p>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-8 py-8">
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">{tab}</p>
              {tab === '기본 정보' && <Step1Basic data={basic} stores={stores} onChange={setBasic} />}
              {tab === '구매 안내' && (
                <div>
                  <p className="text-xs text-brown-muted mb-4">
                    구매 전 확인사항을 그룹으로 관리합니다. 여러 제품이 같은 그룹을 공유할 수 있습니다.
                  </p>
                  <NoticePanel
                    mode="create"
                    noticeData={noticeData}
                    groups={noticeGroups}
                    onChange={setNoticeData}
                  />
                </div>
              )}
              {tab === '태그' && (
                <div>
                  <p className="text-xs text-brown-muted mb-4">
                    태그는 hero 영역에 pill 형태로 표시됩니다. 예: #레진 #한국전통 #키링
                  </p>
                  <TagsPanel mode="create" tags={tags} onChange={setTags} />
                </div>
              )}
              {tab === '섹션' && (
                <div>
                  <p className="text-xs text-brown-muted mb-4">
                    섹션은 랜딩 페이지 본문에 순서대로 표시됩니다.
                  </p>
                  <div className="mb-5 pb-4 border-b border-gold/10">
                    <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-3">공유 콘텐츠</p>
                    <p className="text-xs text-brown-muted mb-3">
                      모티브, 장소 등 여러 제품이 공유하는 설명을 연결합니다.
                    </p>
                    <ContentLibraryPanel
                      mode="create"
                      contentLinks={contentLinks}
                      contentLibrary={contentLibrary}
                      onChange={setContentLinks}
                    />
                  </div>
                  <SectionsPanel mode="create" sections={sections} onChange={setSections} />
                  <div className="mt-5 pt-4 border-t border-gold/10">
                    <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-4">마무리 문구</p>
                    <ClosingTemplatePanel
                      mode="create"
                      closingData={closingData}
                      templates={closingTemplates}
                      onChange={setClosingData}
                      onTemplatesChange={setClosingTemplates}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-[400px] flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
                실시간 미리보기
              </p>
              <div className="flex justify-center mb-2 h-6">
                <span
                  aria-hidden="true"
                  className={`text-[10px] bg-gold text-cream px-3 py-1 rounded-full font-bold transition-opacity ${
                    previewFocused ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  ↕ 스크롤
                </span>
              </div>
              <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
                <div
                  className={`overflow-y-auto overflow-x-hidden rounded-[36px] border-4 shadow-2xl bg-cream-bg [&::-webkit-scrollbar]:hidden transition-colors ${
                    previewFocused ? 'border-gold' : 'border-brown-dark/30'
                  }`}
                  style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px`, scrollbarWidth: 'none' }}
                  onMouseEnter={() => setPreviewFocused(true)}
                  onMouseLeave={() => setPreviewFocused(false)}
                >
                  <div style={{ width: `${INNER_W}px`, zoom: PREVIEW_SCALE, pointerEvents: 'none' }}>
                    <ProductLandingPage product={previewProduct} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SaveCompleteModal
        open={showModal}
        title="생성되었습니다 ✓"
        message="QR 코드가 생성되었습니다"
        primaryLabel="수정 계속하기"
        onPrimary={() => { if (createdId) router.push(`/admin/qr/${createdId}/edit`) }}
        secondaryLabel="홈으로"
        onSecondary={() => router.push('/admin/dashboard')}
      />
    </div>
  )
}
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음 (또는 Task 11 전에 EditClient prop 관련 오류만)

- [ ] **Step 3: Commit**

```bash
git add app/admin/qr/new/page.tsx
git commit -m "feat: add ContentLibraryPanel to new QR page"
```

---

## Task 11: EditClient — ContentLibraryPanel 추가

**Files:**
- Modify: `app/admin/qr/[id]/edit/EditClient.tsx`

- [ ] **Step 1: `app/admin/qr/[id]/edit/EditClient.tsx` 수정**

전체 내용을 아래로 교체:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import { TagsPanel } from '@/components/admin/TagsPanel'
import { SectionsPanel } from '@/components/admin/SectionsPanel'
import { NoticePanel } from '@/components/admin/NoticePanel'
import { ClosingTemplatePanel } from '@/components/admin/ClosingTemplatePanel'
import { ContentLibraryPanel } from '@/components/admin/ContentLibraryPanel'
import { SaveCompleteModal } from '@/components/admin/SaveCompleteModal'
import type {
  QrCodeWithProduct, Product, ProductTag, ProductSection,
  NoticeGroup, Store, ClosingTemplate, ContentLibraryItem, ProductContentLink,
} from '@/lib/types'

interface EditClientProps {
  item: QrCodeWithProduct
  allNoticeGroups: (NoticeGroup & { id: string; name: string })[]
  stores: Store[]
  closingTemplates: ClosingTemplate[]
  contentLibrary: ContentLibraryItem[]
}

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'
const hintClass = 'text-[11px] text-brown-muted font-normal'

const PREVIEW_SCALE = 0.923
const INNER_W = 390
const BORDER_W = 4
const OUTER_W = Math.round(INNER_W * PREVIEW_SCALE) + BORDER_W * 2
const OUTER_H = Math.round(800 * PREVIEW_SCALE) + BORDER_W * 2

const TABS = ['기본 정보', '구매 안내', '태그', '섹션'] as const
type Tab = (typeof TABS)[number]

export function EditClient({
  item,
  allNoticeGroups,
  stores,
  closingTemplates: initialClosingTemplates,
  contentLibrary: initialContentLibrary,
}: EditClientProps) {
  const router = useRouter()
  const p = item.products
  const [tab, setTab] = useState<Tab>('기본 정보')

  const [name, setName] = useState(p?.name ?? '')
  const [subtitle, setSubtitle] = useState(p?.subtitle ?? '')
  const [idusUrl, setIdusUrl] = useState(p?.idus_url ?? '')
  const [storeId, setStoreId] = useState(p?.store_id ?? '')

  const [tags, setTags] = useState<(ProductTag & { id: string })[]>(
    (p?.product_tags ?? []) as (ProductTag & { id: string })[]
  )
  const [sections, setSections] = useState<ProductSection[]>(p?.product_sections ?? [])
  const [noticeGroupId, setNoticeGroupId] = useState<string | null>(p?.notice_group_id ?? null)
  const [closingTemplateId, setClosingTemplateId] = useState<string | null>(p?.closing_template_id ?? null)
  const [closingTemplates, setClosingTemplates] = useState<ClosingTemplate[]>(initialClosingTemplates)
  const [contentLibrary, setContentLibrary] = useState<ContentLibraryItem[]>(initialContentLibrary)
  const [contentLinks, setContentLinks] = useState<ProductContentLink[]>(
    (p?.product_content_links ?? []) as ProductContentLink[]
  )

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [previewFocused, setPreviewFocused] = useState(false)

  const previewProduct: Product = {
    id: p?.id ?? '',
    qr_code_id: item.id,
    store_id: storeId || null,
    name: name.trim() || '(제품명)',
    subtitle: subtitle.trim() || null,
    idus_url: idusUrl.trim() || null,
    is_active: p?.is_active ?? true,
    product_tags: tags,
    notice_groups: allNoticeGroups.find((g) => g.id === noticeGroupId) ?? p?.notice_groups ?? null,
    product_sections: sections,
    product_content_links: contentLinks,
    closing_template_id: closingTemplateId,
    closing_templates: closingTemplates.find((t) => t.id === closingTemplateId) ?? null,
  }

  async function handleSave() {
    if (tab === '기본 정보') {
      setSaving(true)
      setSaveError('')
      const res = await fetch(`/api/qr/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          subtitle: subtitle.trim() || null,
          idus_url: idusUrl.trim() || null,
          store_id: storeId || null,
        }),
      })
      setSaving(false)
      if (!res.ok) {
        const data = await res.json()
        setSaveError(data.error ?? '저장에 실패했습니다.')
        return
      }
    }
    setShowModal(true)
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
          <div className="flex items-center gap-1.5">
            {TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  tab === t
                    ? 'bg-gold text-cream font-bold'
                    : 'text-brown-light border border-gold/30 hover:bg-gold/10'
                }`}
              >
                {i + 1}. {t}
              </button>
            ))}
          </div>
          <Link
            href={`/r/${item.slug}`}
            target="_blank"
            className="text-sm text-brown-light border border-gold/40 rounded-lg px-4 py-2 hover:bg-gold/10 transition-colors"
          >
            페이지 보기 →
          </Link>
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-8 py-8">
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">{tab}</p>

              {tab === '기본 정보' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelClass}>
                      매장 <span className="text-gold">*</span>
                    </label>
                    {stores.length === 0 ? (
                      <p className="text-sm text-red-400 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                        매장이 없습니다.{' '}
                        <a href="/admin/stores" className="underline font-semibold">
                          매장 관리
                        </a>
                        에서 먼저 등록해주세요.
                      </p>
                    ) : (
                      <select
                        value={storeId}
                        onChange={(e) => setStoreId(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">매장을 선택하세요</option>
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}
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
                      한 줄 카피 <span className={hintClass}>(상단에 표시)</span>
                    </label>
                    <input
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="전통의 아름다움을 일상 속에"
                      className={inputClass}
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
              )}

              {tab === '구매 안내' && (
                <div>
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
              )}

              {tab === '태그' && (
                <TagsPanel
                  mode="edit"
                  tags={tags}
                  qrId={item.id}
                  productId={p?.id ?? ''}
                  onUpdate={setTags}
                />
              )}

              {tab === '섹션' && (
                <>
                  <div className="mb-5 pb-4 border-b border-gold/10">
                    <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-3">공유 콘텐츠</p>
                    <ContentLibraryPanel
                      mode="edit"
                      contentLinks={contentLinks}
                      contentLibrary={contentLibrary}
                      qrId={item.id}
                      onUpdate={setContentLinks}
                      onContentLibraryChange={setContentLibrary}
                    />
                  </div>
                  <SectionsPanel
                    mode="edit"
                    sections={sections}
                    qrId={item.id}
                    onUpdate={setSections}
                  />
                  <div className="mt-5 pt-4 border-t border-gold/10">
                    <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-4">마무리 문구</p>
                    <ClosingTemplatePanel
                      mode="edit"
                      currentTemplateId={closingTemplateId}
                      templates={closingTemplates}
                      qrId={item.id}
                      onUpdate={setClosingTemplateId}
                      onTemplatesChange={setClosingTemplates}
                    />
                  </div>
                </>
              )}

              <div className="mt-6 pt-4 border-t border-gold/20 flex items-center justify-end gap-3">
                {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm bg-gold text-cream font-bold px-5 py-2 rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>

          <div className="w-[400px] flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
                실시간 미리보기
              </p>
              <div className="flex justify-center mb-2 h-6">
                <span
                  aria-hidden="true"
                  className={`text-[10px] bg-gold text-cream px-3 py-1 rounded-full font-bold transition-opacity ${
                    previewFocused ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  ↕ 스크롤
                </span>
              </div>
              <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
                <div
                  className={`overflow-y-auto overflow-x-hidden rounded-[36px] border-4 shadow-2xl bg-cream-bg [&::-webkit-scrollbar]:hidden transition-colors ${
                    previewFocused ? 'border-gold' : 'border-brown-dark/30'
                  }`}
                  style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px`, scrollbarWidth: 'none' }}
                  onMouseEnter={() => setPreviewFocused(true)}
                  onMouseLeave={() => setPreviewFocused(false)}
                >
                  <div style={{ width: `${INNER_W}px`, zoom: PREVIEW_SCALE, pointerEvents: 'none' }}>
                    <ProductLandingPage product={previewProduct} />
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

      <SaveCompleteModal
        open={showModal}
        title="저장되었습니다 ✓"
        message="변경사항이 저장되었습니다"
        primaryLabel="계속 수정하기"
        onPrimary={() => setShowModal(false)}
        secondaryLabel="홈으로"
        onSecondary={() => router.push('/admin/dashboard')}
      />
    </div>
  )
}
```

- [ ] **Step 2: 전체 TypeScript 오류 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 전체 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 전체 테스트 PASS

- [ ] **Step 4: Commit**

```bash
git add app/admin/qr/[id]/edit/EditClient.tsx
git commit -m "feat: add ContentLibraryPanel to edit page"
```

---

## 완료 확인

- [ ] `npx vitest run` — 모든 테스트 통과
- [ ] `npx tsc --noEmit` — TypeScript 오류 없음
- [ ] Supabase 대시보드에서 마이그레이션 SQL 실행 완료
- [ ] 로컬 dev 서버 (`npm run dev`)에서 수동 확인:
  - 새 QR 생성 시 섹션 탭에서 공유 콘텐츠 패널이 보임
  - 기존 항목 선택 → 연결 → 미리보기에 반영됨
  - 새 항목 만들기 → 확인 → 연결 → 미리보기에 반영됨
  - 수정 페이지에서 공유 콘텐츠 연결/해제/순서 변경 작동
  - `/r/[slug]` 랜딩 페이지에서 공유 콘텐츠가 고유 섹션보다 먼저 표시됨
