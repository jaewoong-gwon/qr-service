# Closing Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 마무리 문구를 여러 버전의 공유 템플릿으로 관리하고, `product_sections`의 `'closing'` 타입을 제거한다.

**Architecture:** `closing_templates` 테이블을 추가하고 `products.closing_template_id` FK로 참조. 기존 `notice_groups` / `NoticePanel` 패턴을 그대로 재사용.

**Tech Stack:** Next.js 15 App Router, Supabase PostgREST, TypeScript strict, Tailwind CSS v4, Vitest + Testing Library

---

## File Map

| 상태 | 파일 | 변경 내용 |
|---|---|---|
| 수정 | `supabase/migrations/20260616000000_product_schema.sql` | closing_templates 테이블, products 컬럼, sections CHECK 변경 |
| 수정 | `lib/types.ts` | ClosingTemplate, Product, SectionType 변경 |
| 신규 | `app/api/closing-templates/route.ts` | GET (목록), POST (생성) |
| 수정 | `app/api/qr/route.ts` | POST — closing_template_id 처리 |
| 수정 | `app/api/qr/[id]/route.ts` | PATCH — closing_template_id 처리 |
| 신규 | `components/admin/ClosingTemplatePanel.tsx` | create/edit 공용 패널 |
| 수정 | `components/admin/SectionsPanel.tsx` | 'closing' 타입 제거 |
| 수정 | `components/ProductLandingPage.tsx` | closing_templates 렌더링 |
| 수정 | `app/r/[slug]/page.tsx` | closing_templates join 추가 |
| 수정 | `app/admin/qr/[id]/edit/page.tsx` | closing_templates fetch + query 수정 |
| 수정 | `app/admin/qr/[id]/edit/EditClient.tsx` | ClosingTemplatePanel 추가 |
| 수정 | `app/admin/qr/new/page.tsx` | ClosingTemplatePanel 추가 |
| 수정 | `__tests__/components/ProductLandingPage.test.tsx` | mock 및 테스트 업데이트 |

---

## Task 1: Migration — DB 스키마 변경

**Files:**
- Modify: `supabase/migrations/20260616000000_product_schema.sql`

> 이 파일은 전체 리셋 스크립트다. 기존 DROP/CREATE 패턴을 따라 수정한다.

- [ ] **Step 1: closing_templates 테이블 추가, products 컬럼 추가, sections CHECK 변경**

`qr_codes` CREATE 블록 뒤, `notice_groups` 앞에 추가:

```sql
-- 마무리 문구 공통 템플릿
CREATE TABLE closing_templates (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  body text NOT NULL
);
```

`products` CREATE 블록에 컬럼 추가 (`notice_group_id` 줄 뒤):

```sql
  closing_template_id  uuid    REFERENCES closing_templates(id) ON DELETE SET NULL,
```

`product_sections` CHECK 변경:

```sql
-- 변경 전:
  section_type text NOT NULL CHECK (section_type IN ('meaning', 'closing')),
-- 변경 후:
  section_type text NOT NULL CHECK (section_type IN ('meaning')),
```

DROP 목록 맨 위에 추가 (FK 의존 순서):

```sql
DROP TABLE IF EXISTS closing_templates CASCADE;
```

- [ ] **Step 2: Supabase 대시보드 SQL Editor에서 전체 파일 실행**

확인 쿼리:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'closing_template_id';
```
결과: `closing_template_id` 행이 나타나야 함.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260616000000_product_schema.sql
git commit -m "feat(db): add closing_templates table and products.closing_template_id"
```

---

## Task 2: Types 업데이트

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: ClosingTemplate 인터페이스 추가, Product 업데이트, SectionType 변경**

```ts
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
}

export interface QrCodeWithProduct extends QrCode {
  products: Product | null
}
```

- [ ] **Step 2: 타입 오류 확인**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: `SectionType` 변경으로 `'closing'`을 사용하는 곳에서 오류 발생 (이후 태스크에서 수정).

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(types): add ClosingTemplate, update Product, narrow SectionType to meaning"
```

---

## Task 3: API — /api/closing-templates

**Files:**
- Create: `app/api/closing-templates/route.ts`

- [ ] **Step 1: 파일 생성**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getAdminId } from '@/lib/auth'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('closing_templates')
    .select('id, name, body')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const adminId = await getAdminId(request)
  if (!adminId) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { name, body } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: '템플릿 이름을 입력해주세요' }, { status: 400 })
  if (!body?.trim()) return NextResponse.json({ error: '마무리 문구를 입력해주세요' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('closing_templates')
    .insert({ name: name.trim(), body: body.trim() })
    .select('id, name, body')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: dev 서버 실행 후 수동 확인**

```bash
# 생성
curl -X POST http://localhost:3000/api/closing-templates \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=<valid_token>" \
  -d '{"name":"레진 키링 마무리","body":"오래 함께하는 작품이 되길 바랍니다."}'
# 목록
curl http://localhost:3000/api/closing-templates
```

Expected: POST → 201 + `{id, name, body}`, GET → `[{id, name, body}]`

- [ ] **Step 3: Commit**

```bash
git add app/api/closing-templates/route.ts
git commit -m "feat(api): add /api/closing-templates GET and POST"
```

---

## Task 4: API — /api/qr POST + PATCH에 closing_template_id 추가

**Files:**
- Modify: `app/api/qr/route.ts`
- Modify: `app/api/qr/[id]/route.ts`

- [ ] **Step 1: /api/qr POST 수정**

`app/api/qr/route.ts`에서 인터페이스와 POST 핸들러를 수정한다.

인터페이스 추가 (파일 상단 기존 인터페이스 옆):
```ts
interface ClosingInput {
  template_id: string | null
  new_template: { name: string; body: string } | null
}
```

POST 핸들러 내 `const { name, subtitle, idus_url, store_id } = requestBody` 줄 뒤:
```ts
const closing: ClosingInput | null = requestBody.closing ?? null
```

`// 1. Handle notice group` 블록 앞에 새 블록 추가:
```ts
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
```

`// 2. Create product` 블록의 insert 객체에 추가:
```ts
closing_template_id: closingTemplateId,
```

- [ ] **Step 2: /api/qr/[id] PATCH 수정**

`app/api/qr/[id]/route.ts`의 PATCH 핸들러:

```ts
const { name, subtitle, idus_url, store_id, closing_template_id } = requestBody
```

`productUpdates` 조건 블록에 추가:
```ts
if (closing_template_id !== undefined) productUpdates.closing_template_id = closing_template_id
```

- [ ] **Step 3: 타입 오류 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add app/api/qr/route.ts app/api/qr/[id]/route.ts
git commit -m "feat(api): handle closing_template_id in qr POST and PATCH"
```

---

## Task 5: ClosingTemplatePanel 컴포넌트

**Files:**
- Create: `components/admin/ClosingTemplatePanel.tsx`

`NoticePanel`과 동일한 구조. 차이점: `newGroup.items` 없이 `name + body`만.

- [ ] **Step 1: 컴포넌트 작성**

```tsx
'use client'

import { useState } from 'react'
import type { ClosingTemplate } from '@/lib/types'

export interface ClosingFormData {
  mode: 'existing' | 'new'
  templateId: string | null
  newTemplate: { name: string; body: string } | null
}

interface ClosingTemplatePanelCreateProps {
  mode: 'create'
  closingData: ClosingFormData | null
  templates: ClosingTemplate[]
  onChange: (data: ClosingFormData | null) => void
}

interface ClosingTemplatePanelEditProps {
  mode: 'edit'
  currentTemplateId: string | null
  templates: ClosingTemplate[]
  qrId: string
  onUpdate: (templateId: string | null) => void
}

export type ClosingTemplatePanelProps =
  | ClosingTemplatePanelCreateProps
  | ClosingTemplatePanelEditProps

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const selectClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold'

export function ClosingTemplatePanel(props: ClosingTemplatePanelProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBody, setNewBody] = useState('')
  const [loading, setLoading] = useState(false)

  const templates = props.templates

  const selectedTemplateId =
    props.mode === 'create'
      ? props.closingData?.mode === 'existing'
        ? props.closingData.templateId
        : ''
      : props.currentTemplateId ?? ''

  function handleExistingSelect(templateId: string) {
    if (props.mode === 'create') {
      props.onChange(templateId ? { mode: 'existing', templateId, newTemplate: null } : null)
    } else {
      setLoading(true)
      fetch(`/api/qr/${props.qrId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closing_template_id: templateId || null }),
      }).finally(() => {
        props.onUpdate(templateId || null)
        setLoading(false)
      })
    }
  }

  async function confirmNewTemplate() {
    if (!newName.trim() || !newBody.trim()) return

    if (props.mode === 'create') {
      props.onChange({
        mode: 'new',
        templateId: null,
        newTemplate: { name: newName.trim(), body: newBody.trim() },
      })
      setShowNewForm(false)
    } else {
      setLoading(true)
      const res = await fetch('/api/closing-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), body: newBody.trim() }),
      })
      if (res.ok) {
        const tpl: ClosingTemplate = await res.json()
        await fetch(`/api/qr/${props.qrId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ closing_template_id: tpl.id }),
        })
        props.onUpdate(tpl.id)
        setShowNewForm(false)
      }
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {!showNewForm && (
        <>
          <div>
            <label className="block text-xs font-bold text-brown-mid mb-1">마무리 문구 선택</label>
            <select
              value={selectedTemplateId ?? ''}
              onChange={(e) => handleExistingSelect(e.target.value)}
              className={selectClass}
              disabled={loading}
            >
              <option value="">마무리 문구 없음</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="self-start text-xs px-3 py-1.5 border border-gold/40 rounded text-brown-mid hover:bg-gold/10"
          >
            새 템플릿 만들기
          </button>
        </>
      )}

      {showNewForm && (
        <div className="border border-gold/30 rounded-lg p-4 bg-white flex flex-col gap-3">
          <p className="text-xs font-bold text-brown-dark">새 마무리 문구 템플릿</p>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="템플릿 이름 (예: 레진 키링 마무리)"
            className={inputClass}
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="마무리 문구를 입력하세요"
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmNewTemplate}
              disabled={!newName.trim() || !newBody.trim() || loading}
              className="px-4 py-2 text-sm bg-gold text-cream rounded-lg hover:bg-gold/90 disabled:opacity-50"
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 text-sm border border-gold/40 rounded-lg text-brown-light hover:bg-gold/10"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {props.mode === 'create' && props.closingData?.mode === 'new' && props.closingData.newTemplate && (
        <div className="text-xs text-brown-mid bg-cream-bg rounded-lg px-3 py-2">
          새 템플릿:{' '}
          <span className="font-bold text-brown-dark">{props.closingData.newTemplate.name}</span>
          <button
            type="button"
            onClick={() => {
              setNewName(props.closingData!.newTemplate!.name)
              setNewBody(props.closingData!.newTemplate!.body)
              setShowNewForm(true)
              props.onChange(null)
            }}
            className="ml-2 text-gold underline"
          >
            수정
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/ClosingTemplatePanel.tsx
git commit -m "feat(ui): add ClosingTemplatePanel component (create/edit modes)"
```

---

## Task 6: SectionsPanel + SectionCard — 'closing' 타입 완전 제거

**Files:**
- Modify: `components/admin/SectionsPanel.tsx`
- Modify: `components/sections/SectionCard.tsx`
- Modify: `__tests__/components/sections/SectionCard.test.tsx`

- [ ] **Step 1: SectionCard 테스트 업데이트 (failing 확인)**

`__tests__/components/sections/SectionCard.test.tsx`에서 `closing` mock 및 관련 테스트 제거:

```ts
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
}

describe('SectionCard', () => {
  it('title과 body를 렌더링한다', () => {
    render(<SectionCard section={meaning} />)
    expect(screen.getByText('갓의 의미')).toBeInTheDocument()
    expect(screen.getByText('조선시대 선비들이 착용하던 전통 모자입니다.')).toBeInTheDocument()
  })

  it('title이 없으면 body만 렌더링된다', () => {
    render(<SectionCard section={{ ...meaning, title: null }} />)
    expect(screen.queryByText('갓의 의미')).not.toBeInTheDocument()
    expect(screen.getByText('조선시대 선비들이 착용하던 전통 모자입니다.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: SectionCard 컴포넌트 단순화**

`components/sections/SectionCard.tsx`에서 closing 분기 제거:

```tsx
import type { ProductSection } from '@/lib/types'

interface SectionCardProps {
  section: ProductSection
}

export function SectionCard({ section }: SectionCardProps) {
  return (
    <div className="bg-cream rounded-2xl px-5 py-5">
      {section.title && (
        <p className="text-[13px] font-bold text-brown-dark border-l-[3px] border-gold pl-[9px] mb-[10px] leading-snug">
          {section.title}
        </p>
      )}
      {section.body && (
        <p className="text-[14px] text-brown-dark leading-[1.75]">{section.body}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: SectionCard 테스트 실행 — passing 확인**

```bash
npx vitest run __tests__/components/sections/SectionCard.test.tsx 2>&1 | tail -10
```

Expected: ALL PASS

- [ ] **Step 4: SectionsPanel — SECTION_TYPES에서 closing 제거**

```ts
// 변경 전:
const SECTION_TYPES = [
  { value: 'meaning' as const, label: '추가 설명' },
  { value: 'closing' as const, label: '마무리 문구' },
]

// 변경 후:
const SECTION_TYPES = [
  { value: 'meaning' as const, label: '추가 설명' },
]
```

`isClosing` 분기 로직 제거 (항상 meaning이므로):

```ts
// 변경 전:
const isClosing = section.section_type === 'closing'
const selectValue = isClosing ? 'closing' : 'meaning'

// 변경 후: isClosing, selectValue 변수 제거, select value="meaning" 고정
```

JSX에서 `isClosing` 사용하는 부분 정리:
- `{!isClosing && ( <제목 input> )}` → `<제목 input>` (항상 표시)
- `{isClosing ? '마무리 문구' : '설명'}` → `'설명'`
- `placeholder={isClosing ? ... : ...}` → `placeholder="설명을 입력하세요"`

- [ ] **Step 5: 타입 오류 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add components/admin/SectionsPanel.tsx components/sections/SectionCard.tsx \
        __tests__/components/sections/SectionCard.test.tsx
git commit -m "feat(ui): remove closing section type from SectionsPanel and SectionCard"
```

---

## Task 7: ProductLandingPage — closing_templates 렌더링

**Files:**
- Modify: `components/ProductLandingPage.tsx`
- Modify: `__tests__/components/ProductLandingPage.test.tsx`

- [ ] **Step 1: 테스트 먼저 업데이트 (failing 상태 확인)**

`__tests__/components/ProductLandingPage.test.tsx`의 `base` mock에서 `closing` 섹션 제거, `closing_templates` 추가:

```ts
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
}
```

`'closing 섹션이 렌더링된다'` 테스트를 `'closing_templates.body가 렌더링된다'`로 변경:

```ts
it('closing_templates.body가 렌더링된다', () => {
  render(<ProductLandingPage product={base} />)
  expect(screen.getByText('작지만 오래 간직할 수 있는 전통의 가치')).toBeInTheDocument()
})

it('closing_templates가 없으면 마무리 문구가 없다', () => {
  render(<ProductLandingPage product={{ ...base, closing_templates: null }} />)
  expect(screen.queryByText('작지만 오래 간직할 수 있는 전통의 가치')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: 테스트 실행 — failing 확인**

```bash
npx vitest run __tests__/components/ProductLandingPage.test.tsx 2>&1 | tail -20
```

Expected: `'closing_templates.body가 렌더링된다'` FAIL (ProductLandingPage 아직 미수정)

- [ ] **Step 3: ProductLandingPage 수정**

`components/ProductLandingPage.tsx`에서:

`sections` 정의 줄 뒤에 추가:
```ts
const closingBody = product.closing_templates?.body ?? null
```

동적 섹션 블록을 다음으로 교체:
```tsx
{/* 동적 섹션 (meaning 타입만) */}
{sections.map((section) => {
  if (!section.title && !section.body) return null
  return <SectionCard key={section.id} section={section} />
})}

{/* 마무리 문구 — closing_template에서 고정 출력 */}
{closingBody && (
  <SectionCard
    section={{
      id: 'closing',
      section_type: 'meaning',
      title: null,
      body: closingBody,
      sort_order: 9999,
    }}
  />
)}
```

> `SectionCard`는 `section_type`으로 스타일을 분기하지 않으므로 `'meaning'`으로 전달해도 렌더링 동일. `SectionCard`의 closing 스타일이 필요하면 별도 prop을 추가하거나 인라인으로 렌더링.

실제로 SectionCard에 closing 전용 스타일(중앙 정렬, 더 큰 폰트)이 있으므로 다음처럼 처리:

```tsx
{closingBody && (
  <div className="bg-cream rounded-2xl px-5 py-6 text-center">
    <p className="text-[17px] font-bold text-brown-dark leading-[1.7]">
      {closingBody}
    </p>
  </div>
)}
```

- [ ] **Step 4: 테스트 실행 — passing 확인**

```bash
npx vitest run __tests__/components/ProductLandingPage.test.tsx 2>&1 | tail -20
```

Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add components/ProductLandingPage.tsx __tests__/components/ProductLandingPage.test.tsx
git commit -m "feat(ui): render closing_templates.body in ProductLandingPage"
```

---

## Task 8: /r/[slug] 및 edit/page.tsx — Supabase 쿼리 업데이트

**Files:**
- Modify: `app/r/[slug]/page.tsx`
- Modify: `app/admin/qr/[id]/edit/page.tsx`

- [ ] **Step 1: /r/[slug]/page.tsx — closing_templates join 추가**

```ts
const { data: qrCode, error } = await supabase
  .from('qr_codes')
  .select(`
    *,
    products (
      *,
      product_tags ( label, sort_order ),
      notice_groups ( notice_group_items ( content, sort_order ) ),
      closing_templates ( id, name, body ),
      product_sections ( * )
    )
  `)
  .eq('slug', slug)
  .single()
```

- [ ] **Step 2: edit/page.tsx — closing_templates fetch 추가 및 query 수정**

`Promise.all` 배열에 closing_templates fetch 추가:

```ts
const [{ data, error }, { data: allGroups }, { data: allStores }, { data: allClosingTemplates }] =
  await Promise.all([
    supabase
      .from('qr_codes')
      .select(`
        *,
        products (
          *,
          product_tags ( id, label, sort_order ),
          notice_groups ( id, name, notice_group_items ( id, content, sort_order ) ),
          closing_templates ( id, name, body ),
          product_sections ( * )
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
  ])
```

import에 `ClosingTemplate` 추가:
```ts
import type { QrCodeWithProduct, NoticeGroup, Store, ClosingTemplate } from '@/lib/types'
```

`closingTemplates` 변수 추가:
```ts
const closingTemplates = (allClosingTemplates ?? []) as ClosingTemplate[]
```

`EditClient`에 prop 전달:
```tsx
return (
  <EditClient
    item={item}
    allNoticeGroups={groups}
    stores={stores}
    closingTemplates={closingTemplates}
  />
)
```

- [ ] **Step 3: Commit**

```bash
git add app/r/[slug]/page.tsx app/admin/qr/[id]/edit/page.tsx
git commit -m "feat(pages): add closing_templates to Supabase queries"
```

---

## Task 9: EditClient — ClosingTemplatePanel 추가

**Files:**
- Modify: `app/admin/qr/[id]/edit/EditClient.tsx`

- [ ] **Step 1: import 및 props 추가**

파일 상단 import에 추가:
```ts
import { ClosingTemplatePanel } from '@/components/admin/ClosingTemplatePanel'
import type { QrCodeWithProduct, Product, ProductTag, ProductSection, NoticeGroup, Store, ClosingTemplate } from '@/lib/types'
```

`EditClientProps` 인터페이스에 추가:
```ts
interface EditClientProps {
  item: QrCodeWithProduct
  allNoticeGroups: (NoticeGroup & { id: string; name: string })[]
  stores: Store[]
  closingTemplates: ClosingTemplate[]
}
```

- [ ] **Step 2: state 추가 및 previewProduct 업데이트**

함수 내부 state:
```ts
const [closingTemplateId, setClosingTemplateId] = useState<string | null>(p?.closing_template_id ?? null)
```

`previewProduct` 객체에 추가:
```ts
closing_template_id: closingTemplateId,
closing_templates: closingTemplates.find((t) => t.id === closingTemplateId) ?? null,
```

- [ ] **Step 3: 섹션 탭 JSX에 ClosingTemplatePanel 추가**

`{tab === '섹션' && (` 블록 내부, `<SectionsPanel ... />` 뒤에 추가:

```tsx
<div className="mt-5 pt-4 border-t border-gold/10">
  <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-4">마무리 문구</p>
  <ClosingTemplatePanel
    mode="edit"
    currentTemplateId={closingTemplateId}
    templates={closingTemplates}
    qrId={item.id}
    onUpdate={setClosingTemplateId}
  />
</div>
```

- [ ] **Step 4: 타입 오류 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add app/admin/qr/[id]/edit/EditClient.tsx
git commit -m "feat(ui): add ClosingTemplatePanel to EditClient"
```

---

## Task 10: new/page.tsx — ClosingTemplatePanel 추가

**Files:**
- Modify: `app/admin/qr/new/page.tsx`

- [ ] **Step 1: import 추가**

```ts
import { ClosingTemplatePanel, type ClosingFormData } from '@/components/admin/ClosingTemplatePanel'
import type { Product, ProductTag, ProductSection, NoticeGroup, Store, ClosingTemplate } from '@/lib/types'
```

- [ ] **Step 2: state 추가 및 useEffect 업데이트**

state:
```ts
const [closingTemplates, setClosingTemplates] = useState<ClosingTemplate[]>([])
const [closingData, setClosingData] = useState<ClosingFormData | null>(null)
```

`useEffect` 내 `Promise.all`에 closing-templates fetch 추가:
```ts
Promise.all([
  fetch('/api/notice-groups').then((r) => r.json()),
  fetch('/api/stores').then((r) => r.json()),
  fetch('/api/closing-templates').then((r) => r.json()),
]).then(([groups, storeList, templates]) => {
  if (Array.isArray(groups)) setNoticeGroups(groups)
  if (Array.isArray(storeList)) setStores(storeList)
  if (Array.isArray(templates)) setClosingTemplates(templates)
}).catch((err) => console.error('Failed to load data:', err))
```

- [ ] **Step 3: previewProduct에 closing_templates 연결**

```ts
closing_template_id: closingData?.mode === 'existing' ? closingData.templateId : null,
closing_templates:
  closingData?.mode === 'existing' && closingData.templateId
    ? (closingTemplates.find((t) => t.id === closingData.templateId) ?? null)
    : closingData?.mode === 'new' && closingData.newTemplate
      ? { id: '', name: closingData.newTemplate.name, body: closingData.newTemplate.body }
      : null,
```

- [ ] **Step 4: handleCreate — closing 처리 추가**

`handleCreate` 함수 내 `body` 객체에 추가:
```ts
closing: closingData
  ? {
      template_id: closingData.mode === 'existing' ? closingData.templateId : null,
      new_template: closingData.mode === 'new' ? closingData.newTemplate : null,
    }
  : null,
```

- [ ] **Step 5: 섹션 탭 JSX에 ClosingTemplatePanel 추가**

`{tab === '섹션' && (` 블록에서 `<SectionsPanel ... />` 아래에 추가:

```tsx
<div className="mt-5 pt-4 border-t border-gold/10">
  <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-4">마무리 문구</p>
  <ClosingTemplatePanel
    mode="create"
    closingData={closingData}
    templates={closingTemplates}
    onChange={setClosingData}
  />
</div>
```

- [ ] **Step 6: 타입 오류 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 7: 전체 테스트 실행**

```bash
npx vitest run 2>&1 | tail -30
```

Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add app/admin/qr/new/page.tsx
git commit -m "feat(ui): add ClosingTemplatePanel to new QR creation page"
```

---

## 최종 검증 체크리스트

- [ ] `npx tsc --noEmit` — 오류 없음
- [ ] `npx vitest run` — 전체 통과
- [ ] Supabase 대시보드에서 `closing_templates` 테이블 존재 확인
- [ ] `/admin/qr/new` — 섹션 탭에 마무리 문구 선택 UI 표시, 'closing' 섹션 타입 없음
- [ ] `/admin/qr/[id]/edit` — 섹션 탭에 마무리 문구 선택 UI 표시
- [ ] `/r/[slug]` — 마무리 문구가 섹션 하단에 표시
- [ ] 미리보기 — 마무리 문구 선택/생성 시 실시간 반영
