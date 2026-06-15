# Product Landing Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 제품 랜딩 페이지 DB 구조를 텍스트 blob에서 섹션 기반 구조로 전환하고, 랜딩 페이지 렌더러와 어드민 UI를 새 스키마에 맞게 교체한다.

**Architecture:** SQL 마이그레이션 → backward-compatible 타입 추가 → 새 랜딩 페이지 렌더러 구현 → API/admin 코드 정리 → 타입 최종화. 각 태스크 완료 후 `tsc --noEmit` 통과. Task 1에서 기존 타입을 deprecated optional로 유지해 중간 상태에서도 컴파일 가능.

**Tech Stack:** Next.js 16 (App Router, `params: Promise<...>` 패턴), React 19, TypeScript, Supabase (nested select), Tailwind CSS v4 (`cream`, `gold`, `brown-dark` 등 커스텀 토큰), Vitest + Testing Library

---

## File Map

| 파일 | 태스크 | 변경 |
|------|--------|------|
| `supabase/migrations/20260612000000_product_landing_redesign.sql` | T1 | 생성 |
| `lib/types.ts` | T1, T4 | 수정 (T1: 호환 추가, T4: deprecated 제거) |
| `lib/supabase.ts` | T1 | 수정 |
| `app/r/[slug]/page.tsx` | T2 | 수정 |
| `components/ProductLandingPage.tsx` | T2 | 수정 |
| `components/sections/SectionCard.tsx` | T2 | 생성 |
| `components/sections/ItemGridCard.tsx` | T2 | 생성 |
| `__tests__/components/ProductLandingPage.test.tsx` | T2 | 수정 |
| `__tests__/components/sections/SectionCard.test.tsx` | T2 | 생성 |
| `__tests__/components/sections/ItemGridCard.test.tsx` | T2 | 생성 |
| `app/api/qr/route.ts` | T3 | 수정 |
| `app/api/qr/[id]/route.ts` | T3 | 수정 |
| `components/QrTable.tsx` | T3 | 수정 |
| `__tests__/components/QrTable.test.tsx` | T3 | 수정 |
| `app/admin/qr/[id]/edit/EditClient.tsx` | T4 | 수정 |
| `app/admin/qr/[id]/edit/page.tsx` | T4 | 수정 |
| `app/admin/qr/new/page.tsx` | T4 | 수정 |

---

## Task 1: SQL Schema Migration + Backward-Compatible TypeScript Types

**Files:**
- Create: `supabase/migrations/20260612000000_product_landing_redesign.sql`
- Modify: `lib/types.ts`
- Modify: `lib/supabase.ts`

- [ ] **Step 1: SQL 마이그레이션 파일 작성**

```bash
mkdir -p supabase/migrations
```

`supabase/migrations/20260612000000_product_landing_redesign.sql` 전체 내용:

```sql
-- 구매 전 확인사항 공통 그룹 (레진 8종 등 제품군별 공유)
CREATE TABLE IF NOT EXISTS notice_groups (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

-- 그룹별 확인사항 항목
CREATE TABLE IF NOT EXISTS notice_group_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_group_id  uuid NOT NULL REFERENCES notice_groups(id) ON DELETE CASCADE,
  content          text NOT NULL,
  sort_order       int  NOT NULL DEFAULT 0
);

-- 제품별 키워드 태그 (pill 형태)
CREATE TABLE IF NOT EXISTS product_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label      text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0
);

-- 제품 설명 섹션 (meaning, description, color_meaning, closing 등)
CREATE TABLE IF NOT EXISTS product_sections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  title        text,
  body         text,
  sort_order   int  NOT NULL DEFAULT 0
);

-- 섹션 내 개별 아이템 (색상/상징 의미 그리드용)
CREATE TABLE IF NOT EXISTS product_section_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  uuid NOT NULL REFERENCES product_sections(id) ON DELETE CASCADE,
  title       text,
  description text,
  sort_order  int  NOT NULL DEFAULT 0
);

-- products 테이블에 새 컬럼 추가
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS subtitle        text,
  ADD COLUMN IF NOT EXISTS summary         text,
  ADD COLUMN IF NOT EXISTS notice_group_id uuid REFERENCES notice_groups(id),
  ADD COLUMN IF NOT EXISTS is_active       boolean NOT NULL DEFAULT true;

-- 데이터 보존: 기존 description 값을 subtitle로 복사
UPDATE products SET subtitle = description WHERE subtitle IS NULL AND description IS NOT NULL;

-- 기존 컬럼(description, body, quote, keywords, purchase_notes)은 데이터 이전 완료 전까지 DROP하지 않는다.
-- RLS가 활성화된 경우 새 테이블에도 동일한 정책 적용 필요.
```

- [ ] **Step 2: Supabase SQL 에디터에서 마이그레이션 실행**

Supabase 대시보드 → SQL 에디터 → 위 SQL 붙여넣기 → 실행.

확인 쿼리:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notice_groups', 'notice_group_items', 'product_tags', 'product_sections', 'product_section_items');
```
5개 테이블이 모두 나타나야 한다.

- [ ] **Step 3: `lib/types.ts` 전면 교체 (backward-compatible)**

기존 `Product`는 `description`, `body`, `quote`, `keywords`, `purchase_notes`를 required로 가짐.
이번 단계에서 새 필드를 추가하고 기존 필드를 deprecated optional로 변환해 하위 코드가 여전히 컴파일되도록 한다.

```ts
// lib/types.ts

export interface QrCode {
  id: string
  slug: string
  drive_folder_url: string
  created_at: string
}

export interface NoticeGroupItem {
  content: string
  sort_order: number
}

export interface NoticeGroup {
  notice_group_items: NoticeGroupItem[]
}

export interface ProductTag {
  label: string
  sort_order: number
}

export interface ProductSectionItem {
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
  // New fields — optional here for backward compat; made required in Task 4
  subtitle?: string | null
  summary?: string | null
  is_active?: boolean
  idus_url?: string | null
  // New optional join fields (populated by nested select queries)
  product_tags?: ProductTag[]
  notice_groups?: NoticeGroup | null
  product_sections?: ProductSection[]
  // Deprecated: preserved until manual data migration; removed in Task 4
  /** @deprecated use subtitle */
  description?: string | null
  /** @deprecated use product_sections */
  keywords?: string | null
  /** @deprecated use product_sections */
  body?: string | null
  /** @deprecated use product_sections (closing section) */
  quote?: string | null
  /** @deprecated use notice_groups */
  purchase_notes?: string | null
}

export interface QrCodeWithProduct extends QrCode {
  products: Product | null
}
```

- [ ] **Step 4: `lib/supabase.ts` 업데이트 (신규 테이블 추가)**

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { QrCode, Product } from '@/lib/types'

interface Admin {
  id: string
  admin_id: string
  password_hash: string
  created_at: string
}

type Database = {
  public: {
    Tables: {
      qr_codes: {
        Row: QrCode & Record<string, unknown>
        Insert: Omit<QrCode, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<QrCode, 'id' | 'created_at'>> & Record<string, unknown>
        Relationships: []
      }
      products: {
        Row: Product & Record<string, unknown>
        Insert: Omit<Product, 'id' | 'product_tags' | 'notice_groups' | 'product_sections'> & Record<string, unknown>
        Update: Partial<Omit<Product, 'id' | 'product_tags' | 'notice_groups' | 'product_sections'>> & Record<string, unknown>
        Relationships: []
      }
      notice_groups: {
        Row: { id: string; name: string } & Record<string, unknown>
        Insert: { name: string } & Record<string, unknown>
        Update: Partial<{ name: string }> & Record<string, unknown>
        Relationships: []
      }
      notice_group_items: {
        Row: { id: string; notice_group_id: string; content: string; sort_order: number } & Record<string, unknown>
        Insert: { notice_group_id: string; content: string; sort_order?: number } & Record<string, unknown>
        Update: Partial<{ content: string; sort_order: number }> & Record<string, unknown>
        Relationships: []
      }
      product_tags: {
        Row: { id: string; product_id: string; label: string; sort_order: number } & Record<string, unknown>
        Insert: { product_id: string; label: string; sort_order?: number } & Record<string, unknown>
        Update: Partial<{ label: string; sort_order: number }> & Record<string, unknown>
        Relationships: []
      }
      product_sections: {
        Row: { id: string; product_id: string; section_type: string; title: string | null; body: string | null; sort_order: number } & Record<string, unknown>
        Insert: { product_id: string; section_type: string; title?: string | null; body?: string | null; sort_order?: number } & Record<string, unknown>
        Update: Partial<{ section_type: string; title: string | null; body: string | null; sort_order: number }> & Record<string, unknown>
        Relationships: []
      }
      product_section_items: {
        Row: { id: string; section_id: string; title: string | null; description: string | null; sort_order: number } & Record<string, unknown>
        Insert: { section_id: string; title?: string | null; description?: string | null; sort_order?: number } & Record<string, unknown>
        Update: Partial<{ title: string | null; description: string | null; sort_order: number }> & Record<string, unknown>
        Relationships: []
      }
      admins: {
        Row: Admin & Record<string, unknown>
        Insert: Omit<Admin, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<Admin, 'id' | 'created_at'>> & Record<string, unknown>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
  }
}

export function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

기존 코드(EditClient, API routes, QrTable)는 deprecated optional 필드를 통해 여전히 컴파일된다.
오류 없이 종료되어야 한다.

- [ ] **Step 6: 커밋**

```bash
git add supabase/migrations/20260612000000_product_landing_redesign.sql lib/types.ts lib/supabase.ts
git commit -m "feat: add section-based product schema + backward-compatible types"
```

---

## Task 2: Landing Page Renderer

**Files:**
- Modify: `app/r/[slug]/page.tsx`
- Modify: `components/ProductLandingPage.tsx`
- Create: `components/sections/SectionCard.tsx`
- Create: `components/sections/ItemGridCard.tsx`
- Modify: `__tests__/components/ProductLandingPage.test.tsx`
- Create: `__tests__/components/sections/SectionCard.test.tsx`
- Create: `__tests__/components/sections/ItemGridCard.test.tsx`

- [ ] **Step 1: SectionCard 테스트 작성 (실패 확인)**

`__tests__/components/sections/SectionCard.test.tsx` 생성:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SectionCard } from '@/components/sections/SectionCard'
import type { ProductSection } from '@/lib/types'

const meaning: ProductSection = {
  id: 's1',
  section_type: 'meaning',
  title: '갓의 의미',
  body: '조선시대 선비들이 착용하던 전통 모자입니다.',
  sort_order: 0,
  product_section_items: [],
}

const closing: ProductSection = {
  id: 's2',
  section_type: 'closing',
  title: null,
  body: '작지만 오래 간직할 수 있는 전통의 가치',
  sort_order: 1,
  product_section_items: [],
}

describe('SectionCard', () => {
  it('title과 body를 렌더링한다', () => {
    render(<SectionCard section={meaning} />)
    expect(screen.getByText('갓의 의미')).toBeInTheDocument()
    expect(screen.getByText('조선시대 선비들이 착용하던 전통 모자입니다.')).toBeInTheDocument()
  })

  it('closing 섹션은 text-center로 렌더링된다', () => {
    const { container } = render(<SectionCard section={closing} />)
    expect(container.firstChild).toHaveClass('text-center')
  })

  it('closing 섹션의 body가 표시된다', () => {
    render(<SectionCard section={closing} />)
    expect(screen.getByText('작지만 오래 간직할 수 있는 전통의 가치')).toBeInTheDocument()
  })
})
```

```bash
npx vitest run __tests__/components/sections/SectionCard.test.tsx
```

Expected: FAIL (SectionCard not found)

- [ ] **Step 2: SectionCard 구현**

`components/sections/SectionCard.tsx` 생성:

```tsx
import type { ProductSection } from '@/lib/types'

interface SectionCardProps {
  section: ProductSection
}

export function SectionCard({ section }: SectionCardProps) {
  if (section.section_type === 'closing') {
    return (
      <div className="bg-cream rounded-2xl px-5 py-5 text-center">
        {section.title && (
          <p className="text-xs text-gold font-bold tracking-[2px] uppercase mb-3">{section.title}</p>
        )}
        {section.body && (
          <p className="text-xl font-semibold text-brown-dark leading-snug">
            <span className="text-gold text-3xl leading-none">&ldquo;&nbsp;</span>
            {section.body}
            <span className="text-gold">&rdquo;</span>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-cream rounded-2xl px-5 py-5">
      {section.title && (
        <p className="font-bold text-brown-dark text-base mb-3">{section.title}</p>
      )}
      {section.body && (
        <p className="text-sm text-brown-dark leading-relaxed">{section.body}</p>
      )}
    </div>
  )
}
```

```bash
npx vitest run __tests__/components/sections/SectionCard.test.tsx
```

Expected: PASS

- [ ] **Step 3: ItemGridCard 테스트 작성 (실패 확인)**

`__tests__/components/sections/ItemGridCard.test.tsx` 생성:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ItemGridCard } from '@/components/sections/ItemGridCard'
import type { ProductSection } from '@/lib/types'

const colorSection: ProductSection = {
  id: 'c1',
  section_type: 'color_meaning',
  title: '오방색의 의미',
  body: null,
  sort_order: 0,
  product_section_items: [
    { title: '청(靑)', description: '성장과 희망을 뜻합니다', sort_order: 0 },
    { title: '황(黃)', description: '중심과 조화의 의미입니다', sort_order: 1 },
  ],
}

describe('ItemGridCard', () => {
  it('섹션 제목이 표시된다', () => {
    render(<ItemGridCard section={colorSection} />)
    expect(screen.getByText('오방색의 의미')).toBeInTheDocument()
  })

  it('각 아이템의 title과 description이 렌더링된다', () => {
    render(<ItemGridCard section={colorSection} />)
    expect(screen.getByText('청(靑)')).toBeInTheDocument()
    expect(screen.getByText('성장과 희망을 뜻합니다')).toBeInTheDocument()
    expect(screen.getByText('황(黃)')).toBeInTheDocument()
  })

  it('items가 없으면 그리드가 비어있다', () => {
    render(<ItemGridCard section={{ ...colorSection, product_section_items: [] }} />)
    expect(screen.getByText('오방색의 의미')).toBeInTheDocument()
    expect(screen.queryByText('청(靑)')).not.toBeInTheDocument()
  })
})
```

```bash
npx vitest run __tests__/components/sections/ItemGridCard.test.tsx
```

Expected: FAIL

- [ ] **Step 4: ItemGridCard 구현**

`components/sections/ItemGridCard.tsx` 생성:

```tsx
import type { ProductSection } from '@/lib/types'

interface ItemGridCardProps {
  section: ProductSection
}

export function ItemGridCard({ section }: ItemGridCardProps) {
  const items = section.product_section_items
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="bg-cream rounded-2xl px-5 py-5">
      {section.title && (
        <p className="font-bold text-brown-dark text-base mb-4">{section.title}</p>
      )}
      {section.body && (
        <p className="text-sm text-brown-dark leading-relaxed mb-4">{section.body}</p>
      )}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => (
            <div key={i} className="bg-cream-bg rounded-xl px-3 py-3">
              {item.title && (
                <p className="text-xs font-bold text-gold mb-1">{item.title}</p>
              )}
              {item.description && (
                <p className="text-xs text-brown-dark leading-snug">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

```bash
npx vitest run __tests__/components/sections/ItemGridCard.test.tsx
```

Expected: PASS

- [ ] **Step 5: ProductLandingPage 테스트 전면 재작성**

`__tests__/components/ProductLandingPage.test.tsx` 전체 내용 교체:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import type { Product } from '@/lib/types'

const base: Product = {
  id: 'p1',
  qr_code_id: 'qr1',
  name: '레진 갓 키링',
  subtitle: '전통의 아름다움을 일상 속에',
  summary: null,
  idus_url: 'https://www.idus.com/v2/product/abc',
  is_active: true,
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
      product_section_items: [],
    },
    {
      id: 's2',
      section_type: 'closing',
      title: null,
      body: '작지만 오래 간직할 수 있는 전통의 가치',
      sort_order: 1,
      product_section_items: [],
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
    expect(screen.getByText('핸드메이드 제품으로 색상·크기에 차이가 있습니다')).toBeInTheDocument()
  })

  it('meaning 섹션이 렌더링된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByText('갓의 의미')).toBeInTheDocument()
    expect(screen.getByText('한국 전통 갓의 우아한 선을 담았습니다.')).toBeInTheDocument()
  })

  it('closing 섹션이 렌더링된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByText('작지만 오래 간직할 수 있는 전통의 가치')).toBeInTheDocument()
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
})
```

```bash
npx vitest run __tests__/components/ProductLandingPage.test.tsx
```

Expected: FAIL (ProductLandingPage still uses old rendering)

- [ ] **Step 6: ProductLandingPage 전면 재작성**

`components/ProductLandingPage.tsx` 전체 내용 교체:

```tsx
import type { Product } from '@/lib/types'
import type { DriveImage } from '@/lib/drive'
import { SectionCard } from '@/components/sections/SectionCard'
import { ItemGridCard } from '@/components/sections/ItemGridCard'

interface ProductLandingPageProps {
  product: Product | null
  images?: DriveImage[]
}

export function ProductLandingPage({ product, images = [] }: ProductLandingPageProps) {
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

  const sections = (product.product_sections ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Hero */}
      <div className="bg-cream px-5 pt-8 pb-6 text-center">
        {product.subtitle && (
          <p className="text-xs text-brown-mid tracking-wide mb-2">{product.subtitle}</p>
        )}
        <h1 className="text-[32px] font-extrabold text-brown-dark leading-tight tracking-tight">
          {product.name}
        </h1>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className="text-xs font-medium text-brown-mid bg-cream-bg px-3 py-1 rounded-full border border-gold/30"
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
        {product.summary && (
          <p className="text-sm text-brown-mid mt-3 leading-relaxed">{product.summary}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        {/* 구매 전 확인사항 — 최상단 우선 노출 */}
        {noticeItems.length > 0 && (
          <div className="bg-cream rounded-2xl px-5 py-5">
            <p className="font-bold text-brown-dark text-base mb-4">구매 전 확인사항</p>
            <ul className="flex flex-col gap-3">
              {noticeItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-brown-dark flex-shrink-0 mt-0.5 flex items-center justify-center text-[9px] text-cream font-bold">
                    ✓
                  </span>
                  <span className="text-sm text-brown-dark leading-snug">{item.content}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Drive 이미지 갤러리 */}
        {images.length > 0 && (
          <div className="bg-cream rounded-2xl overflow-hidden">
            <div className="flex gap-2 overflow-x-auto px-3 pt-3 pb-2 scrollbar-hide">
              {images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={`https://drive.google.com/thumbnail?id=${img.id}&sz=w600`}
                  alt={img.name}
                  className="h-48 w-auto rounded-xl object-cover flex-shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* 동적 섹션: section_type에 따라 카드 분기 */}
        {sections.map((section) => {
          if (
            section.section_type === 'color_meaning' ||
            section.section_type === 'symbol_meaning'
          ) {
            return <ItemGridCard key={section.id} section={section} />
          }
          return <SectionCard key={section.id} section={section} />
        })}

        {/* 아이디어스 CTA */}
        {product.idus_url && (
          <div className="bg-brown-dark/5 rounded-2xl px-5 py-5">
            <p className="text-sm text-brown-mid leading-relaxed mb-4">
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

- [ ] **Step 7: `app/r/[slug]/page.tsx` — 중첩 쿼리로 교체**

```ts
// app/r/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getFolderImages } from '@/lib/drive'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import type { QrCodeWithProduct } from '@/lib/types'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServerSupabaseClient()

  const { data: qrCode } = await supabase
    .from('qr_codes')
    .select(`
      *,
      products (
        *,
        product_tags ( label, sort_order ),
        notice_groups ( notice_group_items ( content, sort_order ) ),
        product_sections (
          *,
          product_section_items ( title, description, sort_order )
        )
      )
    `)
    .eq('slug', slug)
    .single()

  if (!qrCode) notFound()

  const item = qrCode as unknown as QrCodeWithProduct
  const images = await getFolderImages(item.drive_folder_url)

  return <ProductLandingPage product={item.products} images={images} />
}
```

- [ ] **Step 8: 테스트 및 컴파일 확인**

```bash
npx vitest run __tests__/components/ProductLandingPage.test.tsx __tests__/components/sections/SectionCard.test.tsx __tests__/components/sections/ItemGridCard.test.tsx
```

Expected: PASS (모든 테스트 통과)

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 9: 커밋**

```bash
git add app/r/[slug]/page.tsx components/ProductLandingPage.tsx components/sections/ __tests__/components/ProductLandingPage.test.tsx __tests__/components/sections/
git commit -m "feat: implement section-based product landing page renderer"
```

---

## Task 3: Admin API Routes + QrTable

**Files:**
- Modify: `app/api/qr/route.ts`
- Modify: `app/api/qr/[id]/route.ts`
- Modify: `components/QrTable.tsx`
- Modify: `__tests__/components/QrTable.test.tsx`

- [ ] **Step 1: QrTable 테스트 픽스처 업데이트**

`__tests__/components/QrTable.test.tsx` 의 `mockItem` 내 `products` 객체를 새 필드로 교체한다. 기존 테스트 케이스는 그대로 유지하고 픽스처만 변경한다.

```ts
const mockItem: QrCodeWithProduct = {
  id: '1',
  slug: 'test-slug',
  drive_folder_url: 'https://drive.google.com/drive/folders/abc',
  created_at: '2025-01-01T00:00:00Z',
  products: {
    id: 'p1',
    qr_code_id: '1',
    name: '레진 갓 키링',
    subtitle: null,
    summary: null,
    idus_url: null,
    is_active: true,
  },
}
```

```bash
npx vitest run __tests__/components/QrTable.test.tsx
```

Expected: PASS (픽스처 변경 후에도 기존 테스트 통과)

- [ ] **Step 2: QrTable.tsx — description → subtitle**

`components/QrTable.tsx` 82번 줄의 description 참조를 subtitle로 교체한다.

변경 전:
```tsx
{item.products?.description && (
  <p className="text-sm text-brown-muted mt-0.5">{item.products.description}</p>
)}
```

변경 후:
```tsx
{item.products?.subtitle && (
  <p className="text-sm text-brown-muted mt-0.5">{item.products.subtitle}</p>
)}
```

- [ ] **Step 3: `app/api/qr/route.ts` 전체 교체**

```ts
// app/api/qr/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { computeSlug } from '@/lib/qr'
import { parseFolderUrl } from '@/lib/drive'

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
  const { drive_folder_url, name, subtitle, summary, idus_url } = requestBody

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

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      qr_code_id: qrCode.id,
      name: name.trim(),
      subtitle: subtitle ?? null,
      summary: summary ?? null,
      idus_url: idus_url ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 })
  }

  return NextResponse.json({ ...qrCode, products: product }, { status: 201 })
}
```

- [ ] **Step 4: `app/api/qr/[id]/route.ts` 전체 교체**

```ts
// app/api/qr/[id]/route.ts
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
  const requestBody = await request.json()
  const { drive_folder_url, name, subtitle, summary, idus_url } = requestBody

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

  const productUpdates: Record<string, string | null | boolean> = {}
  if (name !== undefined) productUpdates.name = name
  if (subtitle !== undefined) productUpdates.subtitle = subtitle
  if (summary !== undefined) productUpdates.summary = summary
  if (idus_url !== undefined) productUpdates.idus_url = idus_url

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
```

- [ ] **Step 5: 컴파일 및 테스트 확인**

```bash
npx tsc --noEmit
npx vitest run __tests__/components/QrTable.test.tsx
```

Expected: 컴파일 오류 없음, 테스트 통과

- [ ] **Step 6: 커밋**

```bash
git add app/api/qr/route.ts "app/api/qr/[id]/route.ts" components/QrTable.tsx __tests__/components/QrTable.test.tsx
git commit -m "feat: update admin API and QrTable to new product schema"
```

---

## Task 4: Admin Edit UI + Type Finalization

**Files:**
- Modify: `app/admin/qr/[id]/edit/EditClient.tsx`
- Modify: `app/admin/qr/[id]/edit/page.tsx`
- Modify: `app/admin/qr/new/page.tsx`
- Modify: `lib/types.ts` (deprecated 필드 제거, 새 필드 required화)

- [ ] **Step 1: `app/admin/qr/[id]/edit/page.tsx` — 중첩 쿼리로 교체**

편집 화면의 미리보기가 섹션/태그/구매안내를 반영하려면 edit page에서도 중첩 select가 필요하다.

```ts
// app/admin/qr/[id]/edit/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase'
import { getFolderImages } from '@/lib/drive'
import { notFound } from 'next/navigation'
import { EditClient } from './EditClient'
import type { QrCodeWithProduct } from '@/lib/types'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerSupabaseClient()

  const { data } = await supabase
    .from('qr_codes')
    .select(`
      *,
      products (
        *,
        product_tags ( label, sort_order ),
        notice_groups ( notice_group_items ( content, sort_order ) ),
        product_sections (
          *,
          product_section_items ( title, description, sort_order )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!data) notFound()

  const item = data as unknown as QrCodeWithProduct
  const images = await getFolderImages(item.drive_folder_url)

  return <EditClient item={item} images={images} />
}
```

- [ ] **Step 2: `app/admin/qr/[id]/edit/EditClient.tsx` 전체 교체**

name/subtitle/summary/idus_url만 편집 가능. 섹션/태그/구매안내는 Supabase 직접 편집 안내로 대체.

```tsx
// app/admin/qr/[id]/edit/EditClient.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import type { QrCodeWithProduct, Product } from '@/lib/types'
import type { DriveImage } from '@/lib/drive'

interface EditClientProps {
  item: QrCodeWithProduct
  images: DriveImage[]
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
const OUTER_W = Math.round(INNER_W * PREVIEW_SCALE) // 360
const OUTER_H = Math.round(INNER_H * PREVIEW_SCALE) // 738

export function EditClient({ item, images }: EditClientProps) {
  const p = item.products

  const [driveUrl, setDriveUrl] = useState(item.drive_folder_url ?? '')
  const [name, setName] = useState(p?.name ?? '')
  const [subtitle, setSubtitle] = useState(p?.subtitle ?? '')
  const [summary, setSummary] = useState(p?.summary ?? '')
  const [idusUrl, setIdusUrl] = useState(p?.idus_url ?? '')

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
    product_tags: p?.product_tags,
    notice_groups: p?.notice_groups,
    product_sections: p?.product_sections,
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
      {/* 상단 네비게이션 */}
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
            {saved && (
              <span className="text-sm text-green-600 font-medium">저장되었습니다</span>
            )}
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

      {/* 본문 */}
      <main className="max-w-screen-xl mx-auto px-8 py-8">
        <div className="flex gap-8 items-start">
          {/* 왼쪽: 수정 폼 */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* 기본 정보 */}
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className={sectionHeadClass}>기본 정보</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="drive-url" className={labelClass}>Google Drive 폴더 URL</label>
                  <input
                    id="drive-url"
                    type="url"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className={inputClass}
                  />
                  <p className={`mt-1.5 ${hintClass}`}>변경 시 사진 갤러리가 새 폴더로 교체됩니다.</p>
                </div>

                <div>
                  <label htmlFor="name" className={labelClass}>
                    제품명 <span className="text-gold">*</span>
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="레진 갓 키링"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="subtitle" className={labelClass}>
                    한 줄 카피 <span className={hintClass}>(제품명 위에 표시)</span>
                  </label>
                  <input
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="전통의 아름다움을 일상 속에"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="summary" className={labelClass}>
                    요약 <span className={hintClass}>(hero 영역 하단 짧은 문단)</span>
                  </label>
                  <textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={2}
                    placeholder="제품에 대한 짧은 요약 문장"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div>
                  <label htmlFor="idus-url" className={labelClass}>아이디어스 구매 링크</label>
                  <input
                    id="idus-url"
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

            {/* 섹션/태그/구매안내: Supabase 직접 편집 안내 */}
            <div className="bg-cream border border-gold/30 rounded-xl px-6 py-5 text-sm text-brown-mid">
              <p className="font-bold text-brown-dark mb-2">섹션 · 태그 · 구매 안내 편집</p>
              <p>
                Supabase 대시보드에서 직접{' '}
                <code className="bg-cream-bg px-1 rounded text-xs">product_sections</code>,{' '}
                <code className="bg-cream-bg px-1 rounded text-xs">product_tags</code>,{' '}
                <code className="bg-cream-bg px-1 rounded text-xs">notice_group_items</code>{' '}
                테이블을 편집하세요. 저장 후 페이지를 새로고침하면 미리보기에 반영됩니다.
              </p>
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

- [ ] **Step 3: `app/admin/qr/new/page.tsx` 전체 교체**

description/keywords/body/quote/purchase_notes 필드를 제거하고 subtitle/summary로 교체한다.

```tsx
// app/admin/qr/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GoldBorderCard } from '@/components/GoldBorderCard'

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'
const hintClass = 'text-[11px] text-brown-muted font-normal'

export default function NewQrPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [summary, setSummary] = useState('')
  const [idusUrl, setIdusUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        drive_folder_url: driveUrl,
        subtitle: subtitle.trim() || null,
        summary: summary.trim() || null,
        idus_url: idusUrl || null,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      router.push('/admin/dashboard')
    } else {
      setError(data.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      <nav className="bg-cream border-b border-gold/30 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
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
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <form onSubmit={handleSubmit}>
          <GoldBorderCard>
            <section className="px-6 py-6">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">기본 정보</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="drive-url" className={labelClass}>
                    Google Drive 폴더 URL <span className="text-gold">*</span>
                  </label>
                  <input
                    id="drive-url"
                    type="url"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className={inputClass}
                    required
                  />
                  <p className={`mt-1.5 ${hintClass}`}>사진이 저장된 공개 Google Drive 폴더 주소를 입력하세요.</p>
                </div>

                <div>
                  <label htmlFor="name" className={labelClass}>
                    제품명 <span className="text-gold">*</span>
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="레진 갓 키링"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subtitle" className={labelClass}>
                    한 줄 카피 <span className={hintClass}>(선택 · 제품명 위에 표시)</span>
                  </label>
                  <input
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="전통의 아름다움을 일상 속에"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="summary" className={labelClass}>
                    요약 <span className={hintClass}>(선택 · hero 하단)</span>
                  </label>
                  <textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={2}
                    placeholder="제품에 대한 짧은 요약 문장"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div>
                  <label htmlFor="idus-url" className={labelClass}>
                    아이디어스 구매 링크 <span className={hintClass}>(권장)</span>
                  </label>
                  <input
                    id="idus-url"
                    type="url"
                    value={idusUrl}
                    onChange={(e) => setIdusUrl(e.target.value)}
                    placeholder="https://www.idus.com/v2/product/..."
                    className={inputClass}
                  />
                  <p className={`mt-1.5 ${hintClass}`}>없으면 CTA 버튼이 노출되지 않습니다.</p>
                </div>

                <p className={hintClass}>
                  섹션/태그/구매안내는 생성 후 Supabase 대시보드에서 입력하세요.
                </p>
              </div>
            </section>
          </GoldBorderCard>

          <div className="mt-5 flex justify-end items-center gap-3">
            {error && <p className="text-red-500 text-sm mr-auto">{error}</p>}
            <Link
              href="/admin/dashboard"
              className="px-5 py-2.5 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
            >
              {loading ? '생성 중...' : 'QR 생성'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: `lib/types.ts` 최종화 (deprecated 필드 제거, 새 필드 required화)**

이 단계는 Step 2, 3이 완료된 후 실행한다. deprecated 필드를 참조하는 코드가 없어야 한다.

```ts
// lib/types.ts — FINAL

export interface QrCode {
  id: string
  slug: string
  drive_folder_url: string
  created_at: string
}

export interface NoticeGroupItem {
  content: string
  sort_order: number
}

export interface NoticeGroup {
  notice_group_items: NoticeGroupItem[]
}

export interface ProductTag {
  label: string
  sort_order: number
}

export interface ProductSectionItem {
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
  // Optional: populated only by nested select queries (landing page, edit page)
  product_tags?: ProductTag[]
  notice_groups?: NoticeGroup | null
  product_sections?: ProductSection[]
}

export interface QrCodeWithProduct extends QrCode {
  products: Product | null
}
```

- [ ] **Step 5: 최종 컴파일 및 전체 테스트 실행**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

```bash
npx vitest run
```

Expected: 모든 테스트 통과

- [ ] **Step 6: 커밋**

```bash
git add "app/admin/qr/[id]/edit/EditClient.tsx" "app/admin/qr/[id]/edit/page.tsx" app/admin/qr/new/page.tsx lib/types.ts
git commit -m "feat: update admin edit UI to new schema, finalize Product types"
```

---

## 완료 후 수동 확인 항목

1. Supabase에 `notice_groups`, `product_tags`, `product_sections` 데이터 직접 입력
2. `/r/[slug]` 페이지에서 섹션 렌더링, 구매 전 확인사항 최상단 노출 확인
3. `/admin/qr/[id]/edit` 페이지에서 subtitle/summary 저장, 미리보기 반영 확인
4. `/admin/qr/new` 페이지에서 새 QR 생성 후 대시보드 정상 표시 확인
5. 기존 QR 코드 페이지에서 기존 `description` 값이 `subtitle`로 올바르게 복사됐는지 확인
