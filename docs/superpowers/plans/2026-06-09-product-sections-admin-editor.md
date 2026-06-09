# Product Sections Admin Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin UI for creating, editing, reordering, and deleting `product_sections` for any product.

**Architecture:** A new `/admin/qr/[id]/sections` server-component page fetches data and passes it to a `SectionList` client component. `SectionList` uses `@dnd-kit` for drag-and-drop reordering and renders `SectionCard` components that expand inline to show type-specific forms. Five new API routes handle CRUD and reorder. After QR creation, the user is redirected to the sections page.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase, Tailwind CSS v4, @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities, Vitest + React Testing Library

---

## File Map

**New files — library/utils:**
- `lib/drive.ts` — `parseDriveId(input): string`

**New files — API routes:**
- `app/api/products/[productId]/sections/route.ts` — GET, POST
- `app/api/products/[productId]/sections/[sectionId]/route.ts` — PATCH, DELETE
- `app/api/products/[productId]/sections/reorder/route.ts` — PATCH

**New files — admin page:**
- `app/admin/qr/[id]/sections/page.tsx` — server component

**New files — shared admin components:**
- `components/admin/sections/sectionTypeLabels.ts` — shared label map constant
- `components/admin/sections/formStyles.ts` — shared `inputClass`, `labelClass` strings
- `components/admin/sections/DriveUrlInput.tsx` — Drive URL → ID input with hint
- `components/admin/sections/SectionTypeSelector.tsx` — grid of 7 type buttons
- `components/admin/sections/SectionForm.tsx` — routes to type-specific form
- `components/admin/sections/SectionCard.tsx` — draggable card with inline form
- `components/admin/sections/NewSectionCard.tsx` — creation card (POST on save)
- `components/admin/sections/SectionList.tsx` — DnD container, holds all state

**New files — type-specific forms:**
- `components/admin/sections/forms/QuoteForm.tsx`
- `components/admin/sections/forms/HeroForm.tsx`
- `components/admin/sections/forms/TextBlockForm.tsx`
- `components/admin/sections/forms/RecommendListForm.tsx`
- `components/admin/sections/forms/FeatureCardsForm.tsx`
- `components/admin/sections/forms/SpecsForm.tsx`
- `components/admin/sections/forms/PhotoSectionForm.tsx`

**New files — tests:**
- `__tests__/lib/drive.test.ts`
- `__tests__/components/admin/sections/DriveUrlInput.test.tsx`
- `__tests__/components/admin/sections/SectionTypeSelector.test.tsx`
- `__tests__/components/admin/sections/SectionCard.test.tsx`
- `__tests__/components/admin/sections/SectionList.test.tsx`
- `__tests__/components/admin/sections/forms/QuoteForm.test.tsx`
- `__tests__/components/admin/sections/forms/HeroForm.test.tsx`
- `__tests__/components/admin/sections/forms/TextBlockForm.test.tsx`
- `__tests__/components/admin/sections/forms/RecommendListForm.test.tsx`
- `__tests__/components/admin/sections/forms/FeatureCardsForm.test.tsx`
- `__tests__/components/admin/sections/forms/SpecsForm.test.tsx`
- `__tests__/components/admin/sections/forms/PhotoSectionForm.test.tsx`

**Modified files:**
- `app/admin/qr/new/page.tsx` — redirect to sections page after creation
- `components/QrTable.tsx` — add "섹션" link button
- `__tests__/components/QrTable.test.tsx` — add test for "섹션" button

---

## Task 1: Install @dnd-kit

**Files:** `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Verify TypeScript resolves the types**

```bash
npx tsc --noEmit 2>&1 | grep dnd
```

Expected: no output (no dnd-kit errors).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install @dnd-kit for drag-and-drop section reordering"
```

---

## Task 2: `lib/drive.ts` — parseDriveId utility

**Files:**
- Create: `lib/drive.ts`
- Create: `__tests__/lib/drive.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/drive.test.ts
import { describe, it, expect } from 'vitest'
import { parseDriveId } from '@/lib/drive'

describe('parseDriveId', () => {
  it('extracts ID from /file/d/[ID]/view URL', () => {
    expect(parseDriveId('https://drive.google.com/file/d/abc123XYZ/view?usp=sharing')).toBe('abc123XYZ')
  })

  it('extracts ID from ?id= query param URL', () => {
    expect(parseDriveId('https://drive.google.com/open?id=xyz789ABC')).toBe('xyz789ABC')
  })

  it('extracts ID from uc?id= URL', () => {
    expect(parseDriveId('https://drive.google.com/uc?id=def456&export=download')).toBe('def456')
  })

  it('returns raw input when no URL pattern matches', () => {
    expect(parseDriveId('rawFileId_123')).toBe('rawFileId_123')
  })

  it('trims whitespace from raw input', () => {
    expect(parseDriveId('  rawFileId_123  ')).toBe('rawFileId_123')
  })

  it('returns empty string for empty input', () => {
    expect(parseDriveId('')).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/drive.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/drive'`

- [ ] **Step 3: Implement `lib/drive.ts`**

```ts
// lib/drive.ts
export function parseDriveId(input: string): string {
  const fileMatch = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return fileMatch[1]

  const idMatch = input.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch) return idMatch[1]

  return input.trim()
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/lib/drive.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/drive.ts __tests__/lib/drive.test.ts
git commit -m "feat: add parseDriveId utility for extracting Google Drive file IDs"
```

---

## Task 3: API — GET/POST `/api/products/[productId]/sections`

**Files:**
- Create: `app/api/products/[productId]/sections/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/products/[productId]/sections/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('product_sections')
    .select('*')
    .eq('product_id', productId)
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const body = await request.json()
  const { section_type, display_order, content } = body

  if (!section_type || content === undefined) {
    return NextResponse.json({ error: '필수 필드가 없습니다' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('product_sections')
    .insert({
      product_id: productId,
      section_type,
      display_order: display_order ?? 0,
      content,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "products"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/api/products/
git commit -m "feat: add GET/POST API for product sections"
```

---

## Task 4: API — PATCH/DELETE `/api/products/[productId]/sections/[sectionId]`

**Files:**
- Create: `app/api/products/[productId]/sections/[sectionId]/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/products/[productId]/sections/[sectionId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; sectionId: string }> }
) {
  const { sectionId } = await params
  const body = await request.json()
  const { content } = body

  if (content === undefined) {
    return NextResponse.json({ error: 'content 필드가 없습니다' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('product_sections')
    .update({ content })
    .eq('id', sectionId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string; sectionId: string }> }
) {
  const { sectionId } = await params
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('product_sections')
    .delete()
    .eq('id', sectionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/products/
git commit -m "feat: add PATCH/DELETE API for individual product section"
```

---

## Task 5: API — PATCH `/api/products/[productId]/sections/reorder`

**Files:**
- Create: `app/api/products/[productId]/sections/reorder/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/products/[productId]/sections/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params: _params }: { params: Promise<{ productId: string }> }
) {
  const body = await request.json()
  const { sections } = body as { sections: { id: string; display_order: number }[] }

  if (!Array.isArray(sections)) {
    return NextResponse.json({ error: '잘못된 형식' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  await Promise.all(
    sections.map(({ id, display_order }) =>
      supabase.from('product_sections').update({ display_order }).eq('id', id)
    )
  )

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/products/
git commit -m "feat: add PATCH reorder API for product sections"
```

---

## Task 6: QrTable — add "섹션" button

**Files:**
- Modify: `components/QrTable.tsx`
- Modify: `__tests__/components/QrTable.test.tsx`

- [ ] **Step 1: Write the failing test**

In `__tests__/components/QrTable.test.tsx`, add after the existing tests:

```ts
it('renders 섹션 link button for each item', () => {
  render(<QrTable items={[mockItem]} />)
  const sectionsLink = screen.getByRole('link', { name: '섹션' })
  expect(sectionsLink).toHaveAttribute('href', '/admin/qr/1/sections')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/QrTable.test.tsx
```

Expected: FAIL — `섹션` link not found.

- [ ] **Step 3: Add "섹션" button to QrTable**

In `components/QrTable.tsx`, in the action buttons section (after the `미리보기` Link, before `다운로드`):

```tsx
<Link
  href={`/admin/qr/${item.id}/sections`}
  className="text-xs px-3 py-1.5 rounded bg-cream-bg text-brown-light border border-gold/30 hover:bg-gold/10 transition-colors"
>
  섹션
</Link>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/QrTable.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/QrTable.tsx __tests__/components/QrTable.test.tsx
git commit -m "feat: add 섹션 link button to QrTable"
```

---

## Task 7: Redirect after QR creation

**Files:**
- Modify: `app/admin/qr/new/page.tsx`

- [ ] **Step 1: Add useRouter and redirect on success**

In `app/admin/qr/new/page.tsx`:

1. Add import at top:
```tsx
import { useRouter } from 'next/navigation'
```

2. Inside `NewQrPage`, add:
```tsx
const router = useRouter()
```

3. Replace the `setResult(data)` line in `handleSubmit` with:
```tsx
router.push(`/admin/qr/${data.id}/sections`)
```

4. Remove the `result` state and the QR result JSX block at the bottom (lines 24, 189–199).

The full updated `handleSubmit`:
```tsx
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
      description: description || null,
      price: price || null,
      materials: materials || null,
      dimensions: dimensions || null,
    }),
  })

  const data = await res.json()
  if (res.ok) {
    router.push(`/admin/qr/${data.id}/sections`)
  } else {
    setError(data.error)
  }
  setLoading(false)
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "new/page"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/admin/qr/new/page.tsx
git commit -m "feat: redirect to sections page after QR creation"
```

---

## Task 8: Shared style constants + DriveUrlInput

**Files:**
- Create: `components/admin/sections/formStyles.ts`
- Create: `components/admin/sections/sectionTypeLabels.ts`
- Create: `components/admin/sections/DriveUrlInput.tsx`
- Create: `__tests__/components/admin/sections/DriveUrlInput.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/admin/sections/DriveUrlInput.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DriveUrlInput } from '@/components/admin/sections/DriveUrlInput'

describe('DriveUrlInput', () => {
  it('renders an input with the initial value', () => {
    render(<DriveUrlInput value="abc123" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('abc123')
  })

  it('calls onChange with parsed Drive ID when URL is entered', () => {
    const onChange = vi.fn()
    render(<DriveUrlInput value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://drive.google.com/file/d/xyz789/view' },
    })
    expect(onChange).toHaveBeenCalledWith('xyz789')
  })

  it('shows parsed ID hint when input is a URL', () => {
    render(<DriveUrlInput value="" onChange={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://drive.google.com/file/d/xyz789/view' },
    })
    expect(screen.getByText('파일 ID: xyz789')).toBeInTheDocument()
  })

  it('does not show hint when input is already a raw ID', () => {
    render(<DriveUrlInput value="" onChange={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'rawId123' },
    })
    expect(screen.queryByText(/파일 ID:/)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/sections/DriveUrlInput.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create shared style constants**

```ts
// components/admin/sections/formStyles.ts
export const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'

export const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'
```

```ts
// components/admin/sections/sectionTypeLabels.ts
import type { SectionType } from '@/lib/types'

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  hero: 'HERO',
  text_block: '텍스트 블록',
  feature_cards: '피처 카드',
  specs: '스펙',
  recommend_list: '추천 목록',
  quote: '인용구',
  photo_section: '사진',
}
```

- [ ] **Step 4: Implement DriveUrlInput**

```tsx
// components/admin/sections/DriveUrlInput.tsx
'use client'

import { useState } from 'react'
import { parseDriveId } from '@/lib/drive'
import { inputClass } from './formStyles'

interface DriveUrlInputProps {
  value: string
  onChange: (id: string) => void
  placeholder?: string
  required?: boolean
}

export function DriveUrlInput({ value, onChange, placeholder, required }: DriveUrlInputProps) {
  const [raw, setRaw] = useState(value)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newRaw = e.target.value
    setRaw(newRaw)
    onChange(parseDriveId(newRaw))
  }

  const parsed = parseDriveId(raw)
  const showHint = raw.length > 0 && raw !== parsed

  return (
    <div>
      <input
        type="text"
        value={raw}
        onChange={handleChange}
        placeholder={placeholder ?? 'Google Drive URL 또는 파일 ID'}
        className={inputClass}
        required={required}
      />
      {showHint && (
        <p className="text-[11px] text-brown-muted mt-1">파일 ID: {parsed}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/admin/sections/DriveUrlInput.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/admin/sections/ __tests__/components/admin/sections/DriveUrlInput.test.tsx
git commit -m "feat: add DriveUrlInput component with Drive URL parsing"
```

---

## Task 9: QuoteForm

**Files:**
- Create: `components/admin/sections/forms/QuoteForm.tsx`
- Create: `__tests__/components/admin/sections/forms/QuoteForm.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/admin/sections/forms/QuoteForm.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuoteForm } from '@/components/admin/sections/forms/QuoteForm'
import type { QuoteContent } from '@/lib/types'

const initial: QuoteContent = { text: '좋은 제품', attribution: '홍길동' }

describe('QuoteForm', () => {
  it('renders text and attribution fields with initial values', () => {
    render(<QuoteForm initialContent={initial} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('좋은 제품')).toBeInTheDocument()
    expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
  })

  it('calls onSave with form content on submit', () => {
    const onSave = vi.fn()
    render(<QuoteForm initialContent={{ text: '' }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.change(screen.getByRole('textbox', { name: /인용 텍스트/i }), {
      target: { value: '훌륭한 제품입니다' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ text: '훌륭한 제품입니다' }))
  })

  it('calls onCancel when 취소 is clicked', () => {
    const onCancel = vi.fn()
    render(<QuoteForm initialContent={{ text: '' }} onSave={vi.fn()} onCancel={onCancel} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('disables save button when loading', () => {
    render(<QuoteForm initialContent={{ text: '' }} onSave={vi.fn()} onCancel={vi.fn()} loading={true} error="" />)
    expect(screen.getByRole('button', { name: '저장 중...' })).toBeDisabled()
  })

  it('shows error message when error prop is set', () => {
    render(<QuoteForm initialContent={{ text: '' }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="저장 실패" />)
    expect(screen.getByText('저장 실패')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/sections/forms/QuoteForm.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement QuoteForm**

```tsx
// components/admin/sections/forms/QuoteForm.tsx
'use client'

import { useState } from 'react'
import type { QuoteContent, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'

interface QuoteFormProps {
  initialContent: QuoteContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

export function QuoteForm({ initialContent, onSave, onCancel, loading, error }: QuoteFormProps) {
  const [text, setText] = useState(initialContent.text)
  const [attribution, setAttribution] = useState(initialContent.attribution ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ text, attribution: attribution || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>
          인용 텍스트 <span className="text-gold">*</span>
        </label>
        <textarea
          aria-label="인용 텍스트"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
          required
        />
      </div>
      <div>
        <label className={labelClass}>
          출처 <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
        </label>
        <input
          value={attribution}
          onChange={(e) => setAttribution(e.target.value)}
          className={inputClass}
          placeholder="홍길동, 구매자"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/admin/sections/forms/QuoteForm.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/admin/sections/forms/QuoteForm.tsx __tests__/components/admin/sections/forms/QuoteForm.test.tsx
git commit -m "feat: add QuoteForm component"
```

---

## Task 10: HeroForm

**Files:**
- Create: `components/admin/sections/forms/HeroForm.tsx`
- Create: `__tests__/components/admin/sections/forms/HeroForm.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/admin/sections/forms/HeroForm.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HeroForm } from '@/components/admin/sections/forms/HeroForm'
import type { HeroContent } from '@/lib/types'

const initial: HeroContent = { title: '제목', subtitle: '부제목' }

describe('HeroForm', () => {
  it('renders title and subtitle with initial values', () => {
    render(<HeroForm initialContent={initial} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('제목')).toBeInTheDocument()
    expect(screen.getByDisplayValue('부제목')).toBeInTheDocument()
  })

  it('calls onSave with content including title and subtitle', () => {
    const onSave = vi.fn()
    render(<HeroForm initialContent={{ title: '', subtitle: '' }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.change(screen.getByPlaceholderText(/제목/i) ?? screen.getAllByRole('textbox')[0], {
      target: { value: '신제품' },
    })
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '부제목입니다' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: '신제품', subtitle: '부제목입니다' }))
  })

  it('calls onCancel when 취소 is clicked', () => {
    const onCancel = vi.fn()
    render(<HeroForm initialContent={initial} onSave={vi.fn()} onCancel={onCancel} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/sections/forms/HeroForm.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement HeroForm**

```tsx
// components/admin/sections/forms/HeroForm.tsx
'use client'

import { useState } from 'react'
import type { HeroContent, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'
import { DriveUrlInput } from '../DriveUrlInput'

interface HeroFormProps {
  initialContent: HeroContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

export function HeroForm({ initialContent, onSave, onCancel, loading, error }: HeroFormProps) {
  const [title, setTitle] = useState(initialContent.title)
  const [subtitle, setSubtitle] = useState(initialContent.subtitle)
  const [body, setBody] = useState(initialContent.body ?? '')
  const [imageDriveId, setImageDriveId] = useState(initialContent.image_drive_id ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ title, subtitle, body: body || undefined, image_drive_id: imageDriveId || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>제목 <span className="text-gold">*</span></label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>부제목 <span className="text-gold">*</span></label>
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>본문 <span className="text-[11px] text-brown-muted font-normal">(선택)</span></label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
      </div>
      <div>
        <label className={labelClass}>이미지 Drive URL <span className="text-[11px] text-brown-muted font-normal">(선택)</span></label>
        <DriveUrlInput value={imageDriveId} onChange={setImageDriveId} />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors">{loading ? '저장 중...' : '저장'}</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/admin/sections/forms/HeroForm.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/admin/sections/forms/HeroForm.tsx __tests__/components/admin/sections/forms/HeroForm.test.tsx
git commit -m "feat: add HeroForm component"
```

---

## Task 11: TextBlockForm

**Files:**
- Create: `components/admin/sections/forms/TextBlockForm.tsx`
- Create: `__tests__/components/admin/sections/forms/TextBlockForm.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/admin/sections/forms/TextBlockForm.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TextBlockForm } from '@/components/admin/sections/forms/TextBlockForm'

describe('TextBlockForm', () => {
  it('renders heading and body with initial values', () => {
    render(<TextBlockForm initialContent={{ heading: '제목', body: '본문' }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('제목')).toBeInTheDocument()
    expect(screen.getByDisplayValue('본문')).toBeInTheDocument()
  })

  it('calls onSave with heading and body', () => {
    const onSave = vi.fn()
    render(<TextBlockForm initialContent={{ heading: '', body: '' }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '새 제목' } })
    fireEvent.change(screen.getByRole('textbox', { name: /본문/i }) ?? screen.getAllByRole('textbox')[1], { target: { value: '내용' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ heading: '새 제목', body: '내용' }))
  })

  it('calls onCancel when 취소 is clicked', () => {
    const onCancel = vi.fn()
    render(<TextBlockForm initialContent={{ heading: '', body: '' }} onSave={vi.fn()} onCancel={onCancel} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/sections/forms/TextBlockForm.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement TextBlockForm**

```tsx
// components/admin/sections/forms/TextBlockForm.tsx
'use client'

import { useState } from 'react'
import type { TextBlockContent, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'
import { DriveUrlInput } from '../DriveUrlInput'

interface TextBlockFormProps {
  initialContent: TextBlockContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

export function TextBlockForm({ initialContent, onSave, onCancel, loading, error }: TextBlockFormProps) {
  const [heading, setHeading] = useState(initialContent.heading)
  const [subheading, setSubheading] = useState(initialContent.subheading ?? '')
  const [body, setBody] = useState(initialContent.body)
  const [iconDriveId, setIconDriveId] = useState(initialContent.icon_drive_id ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ heading, subheading: subheading || undefined, body, icon_drive_id: iconDriveId || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>제목 <span className="text-gold">*</span></label>
        <input value={heading} onChange={(e) => setHeading(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>소제목 <span className="text-[11px] text-brown-muted font-normal">(선택)</span></label>
        <input value={subheading} onChange={(e) => setSubheading(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>본문 <span className="text-gold">*</span></label>
        <textarea aria-label="본문" value={body} onChange={(e) => setBody(e.target.value)} rows={4} className={`${inputClass} resize-none`} required />
      </div>
      <div>
        <label className={labelClass}>아이콘 Drive URL <span className="text-[11px] text-brown-muted font-normal">(선택)</span></label>
        <DriveUrlInput value={iconDriveId} onChange={setIconDriveId} />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors">{loading ? '저장 중...' : '저장'}</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run tests, commit**

```bash
npx vitest run __tests__/components/admin/sections/forms/TextBlockForm.test.tsx
git add components/admin/sections/forms/TextBlockForm.tsx __tests__/components/admin/sections/forms/TextBlockForm.test.tsx
git commit -m "feat: add TextBlockForm component"
```

---

## Task 12: RecommendListForm

**Files:**
- Create: `components/admin/sections/forms/RecommendListForm.tsx`
- Create: `__tests__/components/admin/sections/forms/RecommendListForm.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/admin/sections/forms/RecommendListForm.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecommendListForm } from '@/components/admin/sections/forms/RecommendListForm'

describe('RecommendListForm', () => {
  it('renders heading and existing items', () => {
    render(<RecommendListForm initialContent={{ heading: '추천', items: ['항목1', '항목2'] }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('추천')).toBeInTheDocument()
    expect(screen.getByDisplayValue('항목1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('항목2')).toBeInTheDocument()
  })

  it('adds a new item when + 항목 추가 is clicked', () => {
    render(<RecommendListForm initialContent={{ heading: '', items: ['첫 항목'] }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '+ 항목 추가' }))
    expect(screen.getAllByRole('textbox').length).toBe(3) // heading + 2 items
  })

  it('calls onSave with heading and filtered items', () => {
    const onSave = vi.fn()
    render(<RecommendListForm initialContent={{ heading: '목록', items: ['A'] }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith({ heading: '목록', items: ['A'] })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/sections/forms/RecommendListForm.test.tsx
```

- [ ] **Step 3: Implement RecommendListForm**

```tsx
// components/admin/sections/forms/RecommendListForm.tsx
'use client'

import { useState } from 'react'
import type { RecommendListContent, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'

interface RecommendListFormProps {
  initialContent: RecommendListContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

export function RecommendListForm({ initialContent, onSave, onCancel, loading, error }: RecommendListFormProps) {
  const [heading, setHeading] = useState(initialContent.heading)
  const [items, setItems] = useState<string[]>(initialContent.items.length > 0 ? initialContent.items : [''])

  function updateItem(index: number, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  function addItem() {
    setItems((prev) => [...prev, ''])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ heading, items: items.filter(Boolean) })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>제목 <span className="text-gold">*</span></label>
        <input value={heading} onChange={(e) => setHeading(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>항목</label>
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                className={inputClass}
                placeholder={`항목 ${index + 1}`}
              />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(index)} className="px-2 text-red-400 hover:text-red-600 flex-shrink-0">×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-xs text-gold border border-gold/40 rounded-lg px-3 py-1.5 hover:bg-gold/10 self-start transition-colors">+ 항목 추가</button>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors">{loading ? '저장 중...' : '저장'}</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run tests, commit**

```bash
npx vitest run __tests__/components/admin/sections/forms/RecommendListForm.test.tsx
git add components/admin/sections/forms/RecommendListForm.tsx __tests__/components/admin/sections/forms/RecommendListForm.test.tsx
git commit -m "feat: add RecommendListForm component"
```

---

## Task 13: FeatureCardsForm

**Files:**
- Create: `components/admin/sections/forms/FeatureCardsForm.tsx`
- Create: `__tests__/components/admin/sections/forms/FeatureCardsForm.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/admin/sections/forms/FeatureCardsForm.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FeatureCardsForm } from '@/components/admin/sections/forms/FeatureCardsForm'

describe('FeatureCardsForm', () => {
  it('renders heading and initial card fields', () => {
    render(<FeatureCardsForm initialContent={{ heading: '특징', cards: [{ icon_drive_id: '', title: '카드1', description: '설명1' }] }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('특징')).toBeInTheDocument()
    expect(screen.getByDisplayValue('카드1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('설명1')).toBeInTheDocument()
  })

  it('adds a new card when + 카드 추가 is clicked', () => {
    render(<FeatureCardsForm initialContent={{ heading: '', cards: [] }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '+ 카드 추가' }))
    expect(screen.getByText('카드 1')).toBeInTheDocument()
  })

  it('calls onSave with heading and cards on submit', () => {
    const onSave = vi.fn()
    render(<FeatureCardsForm initialContent={{ heading: '기능', cards: [{ icon_drive_id: 'id1', title: '제목', description: '설명' }] }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ heading: '기능' }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/sections/forms/FeatureCardsForm.test.tsx
```

- [ ] **Step 3: Implement FeatureCardsForm**

```tsx
// components/admin/sections/forms/FeatureCardsForm.tsx
'use client'

import { useState } from 'react'
import type { FeatureCardsContent, FeatureCard, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'
import { DriveUrlInput } from '../DriveUrlInput'

interface FeatureCardsFormProps {
  initialContent: FeatureCardsContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

const emptyCard: FeatureCard = { icon_drive_id: '', title: '', description: '' }

export function FeatureCardsForm({ initialContent, onSave, onCancel, loading, error }: FeatureCardsFormProps) {
  const [heading, setHeading] = useState(initialContent.heading)
  const [cards, setCards] = useState<FeatureCard[]>(initialContent.cards.length > 0 ? initialContent.cards : [{ ...emptyCard }])

  function updateCard(index: number, field: keyof FeatureCard, value: string) {
    setCards((prev) => prev.map((card, i) => (i === index ? { ...card, [field]: value } : card)))
  }

  function addCard() {
    setCards((prev) => [...prev, { ...emptyCard }])
  }

  function removeCard(index: number) {
    setCards((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ heading, cards })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>제목 <span className="text-gold">*</span></label>
        <input value={heading} onChange={(e) => setHeading(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>카드 목록</label>
        <div className="flex flex-col gap-4">
          {cards.map((card, index) => (
            <div key={index} className="border border-gold/20 rounded-lg p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold">카드 {index + 1}</span>
                {cards.length > 1 && (
                  <button type="button" onClick={() => removeCard(index)} className="text-xs text-red-400 hover:text-red-600">× 삭제</button>
                )}
              </div>
              <div>
                <label className={labelClass}>아이콘 Drive URL</label>
                <DriveUrlInput value={card.icon_drive_id} onChange={(val) => updateCard(index, 'icon_drive_id', val)} />
              </div>
              <div>
                <label className={labelClass}>카드 제목 <span className="text-gold">*</span></label>
                <input value={card.title} onChange={(e) => updateCard(index, 'title', e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>설명 <span className="text-gold">*</span></label>
                <input value={card.description} onChange={(e) => updateCard(index, 'description', e.target.value)} className={inputClass} required />
              </div>
            </div>
          ))}
          <button type="button" onClick={addCard} className="text-xs text-gold border border-gold/40 rounded-lg px-3 py-1.5 hover:bg-gold/10 self-start transition-colors">+ 카드 추가</button>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors">{loading ? '저장 중...' : '저장'}</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run tests, commit**

```bash
npx vitest run __tests__/components/admin/sections/forms/FeatureCardsForm.test.tsx
git add components/admin/sections/forms/FeatureCardsForm.tsx __tests__/components/admin/sections/forms/FeatureCardsForm.test.tsx
git commit -m "feat: add FeatureCardsForm component"
```

---

## Task 14: SpecsForm

**Files:**
- Create: `components/admin/sections/forms/SpecsForm.tsx`
- Create: `__tests__/components/admin/sections/forms/SpecsForm.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/admin/sections/forms/SpecsForm.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpecsForm } from '@/components/admin/sections/forms/SpecsForm'

describe('SpecsForm', () => {
  it('renders heading and initial items', () => {
    render(<SpecsForm initialContent={{ heading: '스펙', items: [{ image_drive_id: '', label: '레진' }] }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('스펙')).toBeInTheDocument()
    expect(screen.getByDisplayValue('레진')).toBeInTheDocument()
  })

  it('adds a new item when + 항목 추가 is clicked', () => {
    render(<SpecsForm initialContent={{ heading: '', items: [] }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '+ 항목 추가' }))
    expect(screen.getByText('항목 2')).toBeInTheDocument()
  })

  it('calls onSave with content on submit', () => {
    const onSave = vi.fn()
    render(<SpecsForm initialContent={{ heading: '재료', items: [{ image_drive_id: 'id1', label: '레진' }] }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ heading: '재료' }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/sections/forms/SpecsForm.test.tsx
```

- [ ] **Step 3: Implement SpecsForm**

```tsx
// components/admin/sections/forms/SpecsForm.tsx
'use client'

import { useState } from 'react'
import type { SpecsContent, SpecsItem, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'
import { DriveUrlInput } from '../DriveUrlInput'

interface SpecsFormProps {
  initialContent: SpecsContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

const emptyItem: SpecsItem = { image_drive_id: '', label: '' }

export function SpecsForm({ initialContent, onSave, onCancel, loading, error }: SpecsFormProps) {
  const [heading, setHeading] = useState(initialContent.heading)
  const [items, setItems] = useState<SpecsItem[]>(initialContent.items.length > 0 ? initialContent.items : [{ ...emptyItem }])
  const [note, setNote] = useState(initialContent.note ?? '')

  function updateItem(index: number, field: keyof SpecsItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ heading, items, note: note || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>제목 <span className="text-gold">*</span></label>
        <input value={heading} onChange={(e) => setHeading(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>스펙 항목</label>
        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <div key={index} className="border border-gold/20 rounded-lg p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold">항목 {index + 1}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="text-xs text-red-400 hover:text-red-600">× 삭제</button>
                )}
              </div>
              <div>
                <label className={labelClass}>이미지 Drive URL</label>
                <DriveUrlInput value={item.image_drive_id} onChange={(val) => updateItem(index, 'image_drive_id', val)} />
              </div>
              <div>
                <label className={labelClass}>레이블 <span className="text-gold">*</span></label>
                <input value={item.label} onChange={(e) => updateItem(index, 'label', e.target.value)} className={inputClass} required />
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-xs text-gold border border-gold/40 rounded-lg px-3 py-1.5 hover:bg-gold/10 self-start transition-colors">+ 항목 추가</button>
        </div>
      </div>
      <div>
        <label className={labelClass}>주석 <span className="text-[11px] text-brown-muted font-normal">(선택)</span></label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors">{loading ? '저장 중...' : '저장'}</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run tests, commit**

```bash
npx vitest run __tests__/components/admin/sections/forms/SpecsForm.test.tsx
git add components/admin/sections/forms/SpecsForm.tsx __tests__/components/admin/sections/forms/SpecsForm.test.tsx
git commit -m "feat: add SpecsForm component"
```

---

## Task 15: PhotoSectionForm

**Files:**
- Create: `components/admin/sections/forms/PhotoSectionForm.tsx`
- Create: `__tests__/components/admin/sections/forms/PhotoSectionForm.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/admin/sections/forms/PhotoSectionForm.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PhotoSectionForm } from '@/components/admin/sections/forms/PhotoSectionForm'

describe('PhotoSectionForm', () => {
  it('renders image drive URL input', () => {
    render(<PhotoSectionForm initialContent={{ image_drive_id: 'imgId1' }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('imgId1')).toBeInTheDocument()
  })

  it('calls onSave with image_drive_id on submit', () => {
    const onSave = vi.fn()
    render(<PhotoSectionForm initialContent={{ image_drive_id: 'abc' }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ image_drive_id: 'abc' }))
  })

  it('calls onCancel when 취소 is clicked', () => {
    const onCancel = vi.fn()
    render(<PhotoSectionForm initialContent={{ image_drive_id: '' }} onSave={vi.fn()} onCancel={onCancel} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/sections/forms/PhotoSectionForm.test.tsx
```

- [ ] **Step 3: Implement PhotoSectionForm**

```tsx
// components/admin/sections/forms/PhotoSectionForm.tsx
'use client'

import { useState } from 'react'
import type { PhotoSectionContent, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'
import { DriveUrlInput } from '../DriveUrlInput'

interface PhotoSectionFormProps {
  initialContent: PhotoSectionContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

export function PhotoSectionForm({ initialContent, onSave, onCancel, loading, error }: PhotoSectionFormProps) {
  const [imageDriveId, setImageDriveId] = useState(initialContent.image_drive_id)
  const [heading, setHeading] = useState(initialContent.heading ?? '')
  const [body, setBody] = useState(initialContent.body ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ image_drive_id: imageDriveId, heading: heading || undefined, body: body || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>이미지 Drive URL <span className="text-gold">*</span></label>
        <DriveUrlInput value={imageDriveId} onChange={setImageDriveId} required />
      </div>
      <div>
        <label className={labelClass}>제목 <span className="text-[11px] text-brown-muted font-normal">(선택)</span></label>
        <input value={heading} onChange={(e) => setHeading(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>본문 <span className="text-[11px] text-brown-muted font-normal">(선택)</span></label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors">{loading ? '저장 중...' : '저장'}</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run tests, commit**

```bash
npx vitest run __tests__/components/admin/sections/forms/PhotoSectionForm.test.tsx
git add components/admin/sections/forms/PhotoSectionForm.tsx __tests__/components/admin/sections/forms/PhotoSectionForm.test.tsx
git commit -m "feat: add PhotoSectionForm component"
```

---

## Task 16: SectionForm router

**Files:**
- Create: `components/admin/sections/SectionForm.tsx`

No separate test file — SectionForm is a pure routing switch. Its behavior is validated by testing each typed form. Add a note to verify manually that each type renders the correct form.

- [ ] **Step 1: Implement SectionForm**

```tsx
// components/admin/sections/SectionForm.tsx
import type { ProductSection, SectionContent, SectionType } from '@/lib/types'
import { HeroForm } from './forms/HeroForm'
import { TextBlockForm } from './forms/TextBlockForm'
import { FeatureCardsForm } from './forms/FeatureCardsForm'
import { SpecsForm } from './forms/SpecsForm'
import { RecommendListForm } from './forms/RecommendListForm'
import { QuoteForm } from './forms/QuoteForm'
import { PhotoSectionForm } from './forms/PhotoSectionForm'

interface SectionFormProps {
  section: ProductSection | null
  sectionType?: SectionType
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

export function SectionForm({ section, sectionType, onSave, onCancel, loading, error }: SectionFormProps) {
  const type = section?.section_type ?? sectionType!
  const common = { onSave, onCancel, loading, error }

  switch (type) {
    case 'hero':
      return <HeroForm initialContent={section?.section_type === 'hero' ? section.content : { title: '', subtitle: '' }} {...common} />
    case 'text_block':
      return <TextBlockForm initialContent={section?.section_type === 'text_block' ? section.content : { heading: '', body: '' }} {...common} />
    case 'feature_cards':
      return <FeatureCardsForm initialContent={section?.section_type === 'feature_cards' ? section.content : { heading: '', cards: [] }} {...common} />
    case 'specs':
      return <SpecsForm initialContent={section?.section_type === 'specs' ? section.content : { heading: '', items: [] }} {...common} />
    case 'recommend_list':
      return <RecommendListForm initialContent={section?.section_type === 'recommend_list' ? section.content : { heading: '', items: [] }} {...common} />
    case 'quote':
      return <QuoteForm initialContent={section?.section_type === 'quote' ? section.content : { text: '' }} {...common} />
    case 'photo_section':
      return <PhotoSectionForm initialContent={section?.section_type === 'photo_section' ? section.content : { image_drive_id: '' }} {...common} />
    default:
      return null
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "SectionForm"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/admin/sections/SectionForm.tsx
git commit -m "feat: add SectionForm router component"
```

---

## Task 17: SectionTypeSelector

**Files:**
- Create: `components/admin/sections/SectionTypeSelector.tsx`
- Create: `__tests__/components/admin/sections/SectionTypeSelector.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/admin/sections/SectionTypeSelector.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionTypeSelector } from '@/components/admin/sections/SectionTypeSelector'

describe('SectionTypeSelector', () => {
  it('renders all 7 section type buttons', () => {
    render(<SectionTypeSelector onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'HERO' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '텍스트 블록' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '피처 카드' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '스펙' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '추천 목록' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '인용구' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '사진' })).toBeInTheDocument()
  })

  it('calls onSelect with the correct type when a button is clicked', () => {
    const onSelect = vi.fn()
    render(<SectionTypeSelector onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: '인용구' }))
    expect(onSelect).toHaveBeenCalledWith('quote')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/sections/SectionTypeSelector.test.tsx
```

- [ ] **Step 3: Implement SectionTypeSelector**

```tsx
// components/admin/sections/SectionTypeSelector.tsx
import type { SectionType } from '@/lib/types'
import { SECTION_TYPE_LABELS } from './sectionTypeLabels'

const SECTION_TYPES: SectionType[] = [
  'hero', 'text_block', 'feature_cards', 'specs', 'recommend_list', 'quote', 'photo_section',
]

interface SectionTypeSelectorProps {
  onSelect: (type: SectionType) => void
}

export function SectionTypeSelector({ onSelect }: SectionTypeSelectorProps) {
  return (
    <div className="bg-cream border border-dashed border-gold/40 rounded-xl p-4">
      <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-3">섹션 추가</p>
      <div className="grid grid-cols-2 gap-2">
        {SECTION_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="px-3 py-2 text-xs text-brown-dark border border-gold/30 rounded-lg hover:bg-gold/10 hover:border-gold/60 transition-colors text-left"
          >
            {SECTION_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests, commit**

```bash
npx vitest run __tests__/components/admin/sections/SectionTypeSelector.test.tsx
git add components/admin/sections/SectionTypeSelector.tsx __tests__/components/admin/sections/SectionTypeSelector.test.tsx
git commit -m "feat: add SectionTypeSelector component"
```

---

## Task 18: SectionCard + NewSectionCard

**Files:**
- Create: `components/admin/sections/SectionCard.tsx`
- Create: `components/admin/sections/NewSectionCard.tsx`
- Create: `__tests__/components/admin/sections/SectionCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/admin/sections/SectionCard.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionCard } from '@/components/admin/sections/SectionCard'
import type { ProductSection } from '@/lib/types'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

const mockSection: ProductSection = {
  id: 'sec1',
  product_id: 'prod1',
  section_type: 'quote',
  display_order: 0,
  content: { text: '훌륭한 제품' },
}

describe('SectionCard', () => {
  it('renders section type label', () => {
    render(<SectionCard section={mockSection} productId="prod1" isExpanded={false} onToggle={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('인용구')).toBeInTheDocument()
  })

  it('shows form when isExpanded is true', () => {
    render(<SectionCard section={mockSection} productId="prod1" isExpanded={true} onToggle={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByDisplayValue('훌륭한 제품')).toBeInTheDocument()
  })

  it('does not show form when isExpanded is false', () => {
    render(<SectionCard section={mockSection} productId="prod1" isExpanded={false} onToggle={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByDisplayValue('훌륭한 제품')).not.toBeInTheDocument()
  })

  it('calls onToggle when 편집 is clicked', () => {
    const onToggle = vi.fn()
    render(<SectionCard section={mockSection} productId="prod1" isExpanded={false} onToggle={onToggle} onSave={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '편집' }))
    expect(onToggle).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/sections/SectionCard.test.tsx
```

- [ ] **Step 3: Implement SectionCard**

```tsx
// components/admin/sections/SectionCard.tsx
'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SectionForm } from './SectionForm'
import { SECTION_TYPE_LABELS } from './sectionTypeLabels'
import type { ProductSection, SectionContent } from '@/lib/types'

interface SectionCardProps {
  section: ProductSection
  productId: string
  isExpanded: boolean
  onToggle: () => void
  onSave: (section: ProductSection) => void
  onDelete: (id: string) => void
}

export function SectionCard({ section, productId, isExpanded, onToggle, onSave, onDelete }: SectionCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  async function handleSave(content: SectionContent) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${productId}/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '저장 실패'); return }
      onSave(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/products/${productId}/sections/${section.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(section.id)
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-cream border border-gold/40 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <button {...attributes} {...listeners} className="text-gold/60 hover:text-gold cursor-grab active:cursor-grabbing" aria-label="드래그 핸들">≡</button>
        <span className="text-[10px] font-bold tracking-[2px] text-gold flex-1">{SECTION_TYPE_LABELS[section.section_type]}</span>
        <button onClick={onToggle} className="text-xs px-2.5 py-1 rounded border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">
          {isExpanded ? '닫기' : '편집'}
        </button>
        <button onClick={handleDelete} className="text-xs px-2.5 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors">삭제</button>
      </div>
      {isExpanded && (
        <div className="border-t border-gold/20 px-4 py-4">
          <SectionForm section={section} onSave={handleSave} onCancel={onToggle} loading={loading} error={error} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Implement NewSectionCard**

```tsx
// components/admin/sections/NewSectionCard.tsx
'use client'

import { useState } from 'react'
import { SectionForm } from './SectionForm'
import { SECTION_TYPE_LABELS } from './sectionTypeLabels'
import type { ProductSection, SectionContent, SectionType } from '@/lib/types'

interface NewSectionCardProps {
  sectionType: SectionType
  productId: string
  displayOrder: number
  onSave: (section: ProductSection) => void
  onCancel: () => void
}

export function NewSectionCard({ sectionType, productId, displayOrder, onSave, onCancel }: NewSectionCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(content: SectionContent) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${productId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_type: sectionType, display_order: displayOrder, content }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '저장 실패'); return }
      onSave(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-cream border border-gold/40 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-[2px] text-gold flex-1">
          {SECTION_TYPE_LABELS[sectionType]} — 새 섹션
        </span>
      </div>
      <div className="border-t border-gold/20 px-4 py-4">
        <SectionForm section={null} sectionType={sectionType} onSave={handleSave} onCancel={onCancel} loading={loading} error={error} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests, commit**

```bash
npx vitest run __tests__/components/admin/sections/SectionCard.test.tsx
git add components/admin/sections/SectionCard.tsx components/admin/sections/NewSectionCard.tsx __tests__/components/admin/sections/SectionCard.test.tsx
git commit -m "feat: add SectionCard and NewSectionCard components"
```

---

## Task 19: SectionList

**Files:**
- Create: `components/admin/sections/SectionList.tsx`
- Create: `__tests__/components/admin/sections/SectionList.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/admin/sections/SectionList.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionList } from '@/components/admin/sections/SectionList'
import type { ProductSection } from '@/lib/types'

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

const mockSections: ProductSection[] = [
  { id: 's1', product_id: 'p1', section_type: 'quote', display_order: 0, content: { text: '텍스트' } },
  { id: 's2', product_id: 'p1', section_type: 'hero', display_order: 1, content: { title: '제목', subtitle: '부제목' } },
]

describe('SectionList', () => {
  it('renders all section type labels', () => {
    render(<SectionList initialSections={mockSections} productId="p1" />)
    expect(screen.getByText('인용구')).toBeInTheDocument()
    expect(screen.getByText('HERO')).toBeInTheDocument()
  })

  it('renders "섹션 추가" type selector when no section is being added', () => {
    render(<SectionList initialSections={[]} productId="p1" />)
    expect(screen.getByText('섹션 추가')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/sections/SectionList.test.tsx
```

- [ ] **Step 3: Implement SectionList**

```tsx
// components/admin/sections/SectionList.tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { SectionCard } from './SectionCard'
import { NewSectionCard } from './NewSectionCard'
import { SectionTypeSelector } from './SectionTypeSelector'
import type { ProductSection, SectionType } from '@/lib/types'

interface SectionListProps {
  initialSections: ProductSection[]
  productId: string
}

export function SectionList({ initialSections, productId }: SectionListProps) {
  const [sections, setSections] = useState(initialSections)
  const [addingType, setAddingType] = useState<SectionType | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, display_order: i }))
    setSections(reordered)

    try {
      const res = await fetch(`/api/products/${productId}/sections/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: reordered.map((s) => ({ id: s.id, display_order: s.display_order })) }),
      })
      if (!res.ok) throw new Error()
    } catch {
      const res = await fetch(`/api/products/${productId}/sections`)
      if (res.ok) setSections(await res.json())
    }
  }

  function handleSectionSaved(updated: ProductSection) {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setExpandedId(null)
  }

  function handleSectionDeleted(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id))
  }

  function handleNewSectionSaved(section: ProductSection) {
    setSections((prev) => [...prev, section])
    setAddingType(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              productId={productId}
              isExpanded={expandedId === section.id}
              onToggle={() => setExpandedId(expandedId === section.id ? null : section.id)}
              onSave={handleSectionSaved}
              onDelete={handleSectionDeleted}
            />
          ))}
        </SortableContext>
      </DndContext>

      {addingType !== null && (
        <NewSectionCard
          sectionType={addingType}
          productId={productId}
          displayOrder={sections.length}
          onSave={handleNewSectionSaved}
          onCancel={() => setAddingType(null)}
        />
      )}

      {addingType === null && (
        <SectionTypeSelector onSelect={setAddingType} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests, commit**

```bash
npx vitest run __tests__/components/admin/sections/SectionList.test.tsx
git add components/admin/sections/SectionList.tsx __tests__/components/admin/sections/SectionList.test.tsx
git commit -m "feat: add SectionList component with drag-and-drop reordering"
```

---

## Task 20: Sections admin page

**Files:**
- Create: `app/admin/qr/[id]/sections/page.tsx`

- [ ] **Step 1: Implement the page**

```tsx
// app/admin/qr/[id]/sections/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SectionList } from '@/components/admin/sections/SectionList'
import type { ProductSection } from '@/lib/types'

export default async function SectionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerSupabaseClient()

  const { data: qrCode } = await supabase
    .from('qr_codes')
    .select('id')
    .eq('id', id)
    .single()

  if (!qrCode) redirect('/admin/dashboard')

  const { data: product } = await supabase
    .from('products')
    .select('id, name')
    .eq('qr_code_id', id)
    .single()

  if (!product) redirect('/admin/dashboard')

  const { data: sectionsData } = await supabase
    .from('product_sections')
    .select('*')
    .eq('product_id', product.id)
    .order('display_order', { ascending: true })

  const sections = (sectionsData ?? []) as ProductSection[]

  return (
    <div className="min-h-screen bg-cream-bg">
      <nav className="bg-cream border-b border-gold/30 px-7 py-4 flex items-center gap-4">
        <Link
          href="/admin/dashboard"
          className="text-sm text-brown-light border border-gold/40 rounded-md px-3 py-1.5 hover:bg-gold/10 transition-colors"
        >
          ← 대시보드
        </Link>
        <div>
          <h1 className="text-base font-bold text-brown-dark">{product.name}</h1>
          <span className="text-[9px] tracking-[3px] text-gold">SECTIONS</span>
        </div>
      </nav>
      <main className="max-w-[580px] mx-auto px-6 py-7">
        <SectionList initialSections={sections} productId={product.id} />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Run full type check**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

Expected: no errors outside of test files.

- [ ] **Step 3: Run all unit tests**

```bash
npx vitest run
```

Expected: all tests pass (or same failures as before this feature).

- [ ] **Step 4: Commit**

```bash
git add app/admin/qr/
git commit -m "feat: add product sections admin page"
```

---

## Task 21: Final integration commit + push

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__" | grep -v "test\."
```

Expected: no errors.

- [ ] **Step 3: Push**

```bash
git push origin feat/ui-redesign-cream-gold
```
