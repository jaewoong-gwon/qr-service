# Product Landing Page v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 오프라인 매장 QR 스캔 고객을 위한 짧은 제품 안내 페이지 + 아이디어스 구매 버튼 연결 (hero image 없음, price/materials/dimensions 완전 제거)

**Architecture:** `products` 테이블에서 `price`, `materials`, `dimensions` 컬럼을 DROP하고 `idus_url`, `purchase_notes`를 ADD한다. 새 `ProductLandingPage` 서버 컴포넌트가 이 데이터를 받아 렌더링. `/r/[slug]` 라우트는 Drive 이미지/섹션 분기를 제거하고 `ProductLandingPage`만 렌더링. 기존 `ProductDetailView`, `ProductPageView`는 파일 유지, 호출만 제거.

**Tech Stack:** Next.js 16 App Router (Server Components), React 19, Supabase, Tailwind CSS v4, Vitest + React Testing Library, Playwright E2E

---

## 파일 구조

| 파일 | 작업 |
|------|------|
| `components/ProductLandingPage.tsx` | 신규 생성 |
| `__tests__/components/ProductLandingPage.test.tsx` | 신규 생성 |
| `lib/types.ts` | `Product` 인터페이스 수정 |
| `app/r/[slug]/page.tsx` | 라우트 단순화 |
| `app/api/qr/route.ts` | POST handler 수정 |
| `app/api/qr/[id]/route.ts` | PATCH handler 수정 |
| `app/admin/qr/new/page.tsx` | 폼 단순화 |
| `e2e/qr.spec.ts` | 기존 테스트 수정 + 신규 추가 |

---

## Task 1: Supabase DB migration (수동 실행)

**Files:** Supabase SQL Editor (코드 변경 없음)

> ⚠️ DROP 작업은 비가역적입니다. 기존 `price`, `materials`, `dimensions` 데이터가 있으면 삭제됩니다.

- [ ] **Step 1: Supabase 대시보드 SQL Editor 열기**

프로젝트 대시보드 → SQL Editor → New Query

- [ ] **Step 2: 아래 SQL 실행**

```sql
ALTER TABLE products
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS materials,
  DROP COLUMN IF EXISTS dimensions,
  ADD COLUMN IF NOT EXISTS idus_url text,
  ADD COLUMN IF NOT EXISTS purchase_notes text;
```

- [ ] **Step 3: 컬럼 변경 확인**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

Expected: `price`, `materials`, `dimensions` 없음. `idus_url`, `purchase_notes` 있음.

---

## Task 2: Product 타입 업데이트

**Files:**
- Modify: `lib/types.ts:8-16`

- [ ] **Step 1: `Product` 인터페이스 교체**

`lib/types.ts`의 `Product` 인터페이스 블록(8-16번째 줄)을 아래로 교체:

```ts
export interface Product {
  id: string
  qr_code_id: string
  name: string
  description: string | null
  idus_url: string | null
  purchase_notes: string | null
}
```

- [ ] **Step 2: `ProductPageView.tsx`에서 제거된 필드 참조 삭제**

`components/ProductPageView.tsx`의 42-62번째 줄 (price/materials/dimensions 렌더링 블록) 전체를 제거:

```tsx
// 아래 블록 전체 삭제 (42-62번 라인)
{product.price && (
  <p className="text-xl font-bold text-brown-dark">{product.price}</p>
)}
{(product.materials || product.dimensions) && (
  <table className="w-full text-sm mt-3">
    <tbody>
      {product.materials && (
        <tr className="border-t border-gold/20">
          <th className="py-1.5 pr-3 text-left text-brown-light font-normal w-14">소재</th>
          <td className="py-1.5 text-brown-dark">{product.materials}</td>
        </tr>
      )}
      {product.dimensions && (
        <tr className="border-t border-gold/20">
          <th className="py-1.5 pr-3 text-left text-brown-light font-normal w-14">크기</th>
          <td className="py-1.5 text-brown-dark">{product.dimensions}</td>
        </tr>
      )}
    </tbody>
  </table>
)}
```

변경 후 `components/ProductPageView.tsx`의 39-63번째 줄 영역은 아래처럼 된다:

```tsx
{product.description && (
  <p className="text-sm text-brown-mid leading-relaxed mb-3">{product.description}</p>
)}
```

- [ ] **Step 3: `ProductPageView.test.tsx` mock 수정**

`__tests__/components/ProductPageView.test.tsx`의 `product` mock (7-15번 라인)을 아래로 교체:

```ts
const product: Product = {
  id: '1',
  qr_code_id: 'qr1',
  name: '레진 갓 키링',
  description: '전통 키링',
  idus_url: null,
  purchase_notes: null,
}
```

- [ ] **Step 4: `QrTable.test.tsx` mock 수정**

`__tests__/components/QrTable.test.tsx`에서 product mock 안의 `price: null, materials: null, dimensions: null` 세 줄을 제거하고 아래 두 줄을 추가:

```ts
idus_url: null,
purchase_notes: null,
```

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없이 종료

- [ ] **Step 6: Vitest 확인**

```bash
npx vitest run
```

Expected: PASS (ProductPageView 기존 테스트 3개 통과)

- [ ] **Step 7: 커밋**

```bash
git add lib/types.ts components/ProductPageView.tsx __tests__/components/ProductPageView.test.tsx __tests__/components/QrTable.test.tsx
git commit -m "feat: simplify Product type — remove price/materials/dimensions, add idus_url/purchase_notes"
```

---

## Task 3: ProductLandingPage 컴포넌트 (TDD)

**Files:**
- Create: `__tests__/components/ProductLandingPage.test.tsx`
- Create: `components/ProductLandingPage.tsx`

- [ ] **Step 1: 테스트 파일 생성**

`__tests__/components/ProductLandingPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import type { Product } from '@/lib/types'

const baseProduct: Product = {
  id: '1',
  qr_code_id: 'qr1',
  name: '레진 갓 키링',
  description: '전통 갓의 아름다움을 담은 레진 키링',
  idus_url: 'https://www.idus.com/v2/product/abc123',
  purchase_notes: '핸드메이드 제품으로 색상·크기에 차이가 있을 수 있습니다.',
}

describe('ProductLandingPage', () => {
  it('제품명이 h1으로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByRole('heading', { name: '레진 갓 키링' })).toBeInTheDocument()
  })

  it('description이 있으면 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('전통 갓의 아름다움을 담은 레진 키링')).toBeInTheDocument()
  })

  it('purchase_notes가 있으면 구매 전 확인사항 섹션이 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('구매 전 확인사항')).toBeInTheDocument()
    expect(screen.getByText(/핸드메이드 제품으로/)).toBeInTheDocument()
  })

  it('idus_url이 있으면 구매 링크가 올바른 href로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    const link = screen.getByRole('link', { name: /아이디어스에서 구매하기/ })
    expect(link).toHaveAttribute('href', 'https://www.idus.com/v2/product/abc123')
  })

  it('idus_url이 없으면 구매 버튼이 없고 준비 중 안내가 표시된다', () => {
    render(<ProductLandingPage product={{ ...baseProduct, idus_url: null }} />)
    expect(screen.queryByRole('link', { name: /아이디어스에서 구매하기/ })).not.toBeInTheDocument()
    expect(screen.getByText('구매 링크 준비 중입니다')).toBeInTheDocument()
  })

  it('purchase_notes가 없으면 구매 전 확인사항 섹션이 없다', () => {
    render(<ProductLandingPage product={{ ...baseProduct, purchase_notes: null }} />)
    expect(screen.queryByText('구매 전 확인사항')).not.toBeInTheDocument()
  })

  it('product가 null이면 기본 문구가 표시된다', () => {
    render(<ProductLandingPage product={null} />)
    expect(screen.getByText('제품 정보 없음')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

```bash
npx vitest run __tests__/components/ProductLandingPage.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/ProductLandingPage'`

- [ ] **Step 3: 컴포넌트 구현**

`components/ProductLandingPage.tsx`:

```tsx
import type { Product } from '@/lib/types'

interface ProductLandingPageProps {
  product: Product | null
}

export function ProductLandingPage({ product }: ProductLandingPageProps) {
  return (
    <div className="min-h-screen bg-cream-bg pb-24">
      <header className="border-b border-gold/30 py-3 text-center">
        <span className="text-[10px] tracking-[4px] text-gold uppercase">작품 이야기</span>
      </header>

      <main className="max-w-[480px] mx-auto px-5">
        <h1 className="mt-5 text-2xl font-bold text-brown-dark">
          {product?.name ?? '제품 정보 없음'}
        </h1>
        <div className="w-12 h-px bg-gold/60 mt-3 mb-4" />

        {product?.description && (
          <p className="text-sm text-brown-mid leading-relaxed">{product.description}</p>
        )}

        {product?.purchase_notes && (
          <div className="mt-6 bg-cream border border-gold/20 rounded-xl p-4">
            <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-3">
              구매 전 확인사항
            </p>
            <p className="text-sm text-brown-mid leading-relaxed whitespace-pre-line">
              {product.purchase_notes}
            </p>
          </div>
        )}

        {product?.idus_url ? (
          <p className="mt-5 text-xs text-brown-muted text-center">
            아이디어스(idus)에서 판매 중입니다
          </p>
        ) : (
          <p className="mt-6 text-xs text-brown-muted text-center">구매 링크 준비 중입니다</p>
        )}
      </main>

      {product?.idus_url && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-cream-bg/95 backdrop-blur-sm border-t border-gold/20">
          <a
            href={product.idus_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full max-w-[480px] mx-auto bg-gold text-cream text-center font-bold py-3.5 rounded-xl text-sm tracking-wide hover:bg-gold/90 transition-colors"
          >
            아이디어스에서 구매하기 →
          </a>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/components/ProductLandingPage.test.tsx
```

Expected: 7/7 PASS

- [ ] **Step 5: 커밋**

```bash
git add components/ProductLandingPage.tsx __tests__/components/ProductLandingPage.test.tsx
git commit -m "feat: add ProductLandingPage component for offline QR landing"
```

---

## Task 4: /r/[slug]/page.tsx 단순화

**Files:**
- Modify: `app/r/[slug]/page.tsx`

현재 파일은 sections.length > 0이면 `ProductDetailView`, 아니면 Drive 이미지 + `ProductPageView`를 보여주는 분기가 있다. 이를 `ProductLandingPage` 단일 렌더링으로 교체한다.

- [ ] **Step 1: 파일 전체 교체**

`app/r/[slug]/page.tsx`를 아래 내용으로 교체:

```tsx
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ProductLandingPage } from '@/components/ProductLandingPage'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServerSupabaseClient()

  const { data: qrCode } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!qrCode) notFound()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('qr_code_id', qrCode.id)
    .single()

  return <ProductLandingPage product={product ?? null} />
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add app/r/[slug]/page.tsx
git commit -m "refactor: simplify /r/[slug] to use ProductLandingPage only"
```

---

## Task 5: POST /api/qr route 수정

**Files:**
- Modify: `app/api/qr/route.ts`

현재 POST handler는 `price`, `materials`, `dimensions`를 처리한다. 이를 제거하고 `idus_url`, `purchase_notes`를 추가한다.

- [ ] **Step 1: POST handler의 destructuring과 INSERT 수정**

`app/api/qr/route.ts`의 POST 함수 전체를 아래로 교체:

```ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { drive_folder_url, name, description, idus_url, purchase_notes } = body

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
          description: description ?? null,
          idus_url: idus_url ?? null,
          purchase_notes: purchase_notes ?? null,
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
      description: description ?? null,
      idus_url: idus_url ?? null,
      purchase_notes: purchase_notes ?? null,
    })
    .select()
    .single()

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 })
  }

  return NextResponse.json({ ...qrCode, products: product }, { status: 201 })
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add app/api/qr/route.ts
git commit -m "feat: update POST /api/qr — remove price/materials/dimensions, add idus_url/purchase_notes"
```

---

## Task 6: PATCH /api/qr/[id] route 수정

**Files:**
- Modify: `app/api/qr/[id]/route.ts:21-81`

- [ ] **Step 1: PATCH handler 수정**

`app/api/qr/[id]/route.ts`의 PATCH 함수 전체를 아래로 교체:

```ts
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
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add app/api/qr/[id]/route.ts
git commit -m "feat: update PATCH /api/qr/[id] — remove price/materials/dimensions, add idus_url/purchase_notes"
```

---

## Task 7: 어드민 QR 생성 폼 단순화

**Files:**
- Modify: `app/admin/qr/new/page.tsx`

현재 폼에는 `price`, `materials`, `dimensions` state와 input이 있다. 이를 제거하고 `idusUrl`, `purchaseNotes`를 추가한다.

- [ ] **Step 1: 파일 전체 교체**

`app/admin/qr/new/page.tsx`를 아래 내용으로 교체:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GoldBorderCard } from '@/components/GoldBorderCard'

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'

export default function NewQrPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [description, setDescription] = useState('')
  const [idusUrl, setIdusUrl] = useState('')
  const [purchaseNotes, setPurchaseNotes] = useState('')
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
        description: description || null,
        idus_url: idusUrl || null,
        purchase_notes: purchaseNotes || null,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      router.push(`/admin/qr/${data.id}/sections`)
    } else {
      setError(data.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      <nav className="bg-cream border-b border-gold/30 px-7 py-4 flex items-center gap-4">
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
      </nav>

      <main className="max-w-[580px] mx-auto px-6 py-7">
        <form onSubmit={handleSubmit}>
          <GoldBorderCard>
            <section className="px-6 py-6">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">기본 정보</p>
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
                <p className="text-[11px] text-brown-muted mt-1.5">
                  사진이 저장된 공개 Google Drive 폴더 주소를 입력하세요.
                </p>
              </div>
            </section>

            <section className="px-6 py-6 border-t border-gold/20">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">제품 정보</p>
              <div className="flex flex-col gap-4">
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
                  <label htmlFor="description" className={labelClass}>
                    작품 소개 <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="어떤 작품인지 2-3줄로 소개해주세요"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            </section>

            <section className="px-6 py-6 border-t border-gold/20">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">랜딩 페이지</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="idus-url" className={labelClass}>
                    아이디어스 구매 링크{' '}
                    <span className="text-[11px] text-brown-muted font-normal">(권장)</span>
                  </label>
                  <input
                    id="idus-url"
                    type="url"
                    value={idusUrl}
                    onChange={(e) => setIdusUrl(e.target.value)}
                    placeholder="https://www.idus.com/v2/product/..."
                    className={inputClass}
                  />
                  <p className="text-[11px] text-brown-muted mt-1.5">
                    없으면 구매 버튼이 노출되지 않습니다.
                  </p>
                </div>

                <div>
                  <label htmlFor="purchase-notes" className={labelClass}>
                    구매 전 확인사항{' '}
                    <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
                  </label>
                  <textarea
                    id="purchase-notes"
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                    rows={4}
                    placeholder="핸드메이드 제품으로 색상·크기에 차이가 있을 수 있습니다."
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            </section>

            <div className="px-6 py-4 border-t border-gold/20 flex justify-end gap-2.5">
              {error && <p className="text-red-500 text-sm flex-1 self-center">{error}</p>}
              <Link
                href="/admin/dashboard"
                className="px-5 py-2.5 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
              >
                {loading ? '생성 중...' : 'QR 생성'}
              </button>
            </div>
          </GoldBorderCard>
        </form>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add app/admin/qr/new/page.tsx
git commit -m "feat: simplify admin QR form — remove price/materials/dimensions, add idus_url/purchase_notes"
```

---

## Task 8: E2E 테스트 업데이트

**Files:**
- Modify: `e2e/qr.spec.ts`

현재 `'QR creation form has product detail fields'` 테스트는 `가격`, `소재`, `크기` 라벨을 체크하는데, 이 필드들이 폼에서 제거되므로 업데이트가 필요하다.

- [ ] **Step 1: 기존 테스트 통과 여부 확인 (변경 전)**

```bash
npx playwright test e2e/qr.spec.ts --reporter=line
```

Expected: `'QR creation form has product detail fields'` 테스트가 가격/소재/크기 필드를 찾아 PASS (아직 폼 변경 전이므로)

- [ ] **Step 2: `e2e/qr.spec.ts` 파일 수정**

파일 전체를 아래 내용으로 교체:

```ts
// e2e/qr.spec.ts
// Auth cookie is injected via globalSetup (JWT_SECRET) — no login credentials needed.
import { test, expect } from '@playwright/test'

const TEST_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/e2e-test-folder-id'
const TEST_PRODUCT_NAME = 'E2E Test Product'

test('can access /admin/qr/new when authenticated', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByRole('heading', { name: '새 QR 코드 생성' })).toBeVisible()
})

test('QR creation form has correct fields', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByLabel('제품명')).toBeVisible()
  await expect(page.getByLabel('Google Drive 폴더 URL')).toBeVisible()
  await expect(page.getByLabel('작품 소개', { exact: false })).toBeVisible()
  await expect(page.getByLabel('아이디어스 구매 링크', { exact: false })).toBeVisible()
  await expect(page.getByLabel('구매 전 확인사항', { exact: false })).toBeVisible()
})

test('invalid URL shows error', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('Google Drive 폴더 URL').fill('https://not-drive.com/file')
  await page.getByRole('button', { name: 'QR 생성' }).click()
  await expect(page.getByText('유효한 Google Drive 링크가 아닙니다')).toBeVisible()
})

test('valid Drive folder URL creates QR and redirects to sections page', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('Google Drive 폴더 URL').fill(TEST_DRIVE_FOLDER_URL)
  await page.getByRole('button', { name: 'QR 생성' }).click()
  await expect(page).toHaveURL(/\/admin\/qr\/.+\/sections/)
})

test('same Drive folder URL returns same slug', async ({ page }) => {
  const res1 = await page.request.post('/api/qr', {
    data: { name: TEST_PRODUCT_NAME, drive_folder_url: TEST_DRIVE_FOLDER_URL },
  })
  expect(res1.ok()).toBeTruthy()
  const data1 = await res1.json()

  const res2 = await page.request.post('/api/qr', {
    data: { name: '다른 제품명', drive_folder_url: TEST_DRIVE_FOLDER_URL },
  })
  expect(res2.ok()).toBeTruthy()
  const data2 = await res2.json()

  expect(data1.slug).toBe(data2.slug)
  expect(data1.id).toBe(data2.id)
})

test('/r/{slug} shows product name', async ({ page }) => {
  const createRes = await page.request.post('/api/qr', {
    data: { name: TEST_PRODUCT_NAME, drive_folder_url: TEST_DRIVE_FOLDER_URL },
  })
  const { slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()
})

test('/r/{slug} shows idus purchase button when idus_url is provided', async ({ page }) => {
  const createRes = await page.request.post('/api/qr', {
    data: {
      name: TEST_PRODUCT_NAME,
      drive_folder_url: TEST_DRIVE_FOLDER_URL,
      idus_url: 'https://www.idus.com/v2/product/e2e-test-id',
      purchase_notes: 'E2E 테스트 확인사항',
    },
  })
  const { slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()
  const link = page.getByRole('link', { name: /아이디어스에서 구매하기/ })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', 'https://www.idus.com/v2/product/e2e-test-id')
  await expect(page.getByText('E2E 테스트 확인사항')).toBeVisible()
})
```

- [ ] **Step 3: E2E 테스트 전체 실행**

```bash
npx playwright test e2e/qr.spec.ts --reporter=line
```

Expected: 7/7 PASS

- [ ] **Step 4: 커밋**

```bash
git add e2e/qr.spec.ts
git commit -m "test: update E2E tests for simplified form and new landing page fields"
```

---

## 최종 검증

- [ ] **Vitest 전체 실행**

```bash
npx vitest run
```

Expected: 전체 PASS

- [ ] **TypeScript 컴파일 최종 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **E2E 전체 실행**

```bash
npx playwright test
```

Expected: 전체 PASS
