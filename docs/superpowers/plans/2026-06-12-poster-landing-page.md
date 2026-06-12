# 모바일 포스터형 랜딩 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `products` 테이블에 `keywords`, `body`, `quote` 컬럼을 추가하고, 랜딩 페이지를 헤로·스토리 카드·체크리스트 카드·CTA 카드로 구성된 모바일 포스터형 레이아웃으로 재구성한다.

**Architecture:** DB에 3개 nullable TEXT 컬럼 추가(수동 마이그레이션) → `lib/types.ts` + API routes 동기화 → `ProductLandingPage` 컴포넌트 전면 재작성(TDD) → Admin 입력폼 확장. 신규 컬럼은 모두 nullable이므로 기존 제품은 해당 섹션만 조건부로 숨겨져 하위 호환된다.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4 (custom tokens: cream/gold/brown), Vitest + React Testing Library, Supabase

---

## 파일 구조

| 파일 | 작업 |
|------|------|
| `lib/types.ts` | `Product` 타입에 `keywords`, `body`, `quote` 추가 |
| `app/api/qr/route.ts` | POST 핸들러에 신규 3개 필드 추가 |
| `app/api/qr/[id]/route.ts` | PATCH 핸들러에 신규 3개 필드 추가 |
| `components/ProductLandingPage.tsx` | 포스터형 레이아웃 전면 재작성 |
| `__tests__/components/ProductLandingPage.test.tsx` | 11개 테스트로 업데이트 |
| `app/admin/qr/new/page.tsx` | `keywords`, `body`, `quote` 입력폼 추가 |

---

## Task 1: Product 타입 + API 업데이트

> **전제 조건 — 코드 변경 전 필수:** Supabase 대시보드 → SQL Editor에서 아래 SQL을 실행한다.
>
> ```sql
> ALTER TABLE products
>   ADD COLUMN IF NOT EXISTS keywords TEXT DEFAULT NULL,
>   ADD COLUMN IF NOT EXISTS body     TEXT DEFAULT NULL,
>   ADD COLUMN IF NOT EXISTS quote    TEXT DEFAULT NULL;
> ```
>
> 실행 결과 "Success. No rows returned" 확인 후 다음 단계로 진행.

**Files:**
- Modify: `lib/types.ts`
- Modify: `app/api/qr/route.ts`
- Modify: `app/api/qr/[id]/route.ts`

---

- [ ] **Step 1: `lib/types.ts` 전체 교체**

```ts
export interface QrCode {
  id: string
  slug: string
  drive_folder_url: string
  created_at: string
}

export interface Product {
  id: string
  qr_code_id: string
  name: string
  description: string | null
  idus_url: string | null
  purchase_notes: string | null
  keywords: string | null
  body: string | null
  quote: string | null
}

export interface QrCodeWithProduct extends QrCode {
  products: Product | null
}
```

---

- [ ] **Step 2: `app/api/qr/route.ts` POST 핸들러 수정**

Line 22의 destructure를 아래로 교체:
```ts
const { drive_folder_url, name, description, idus_url, purchase_notes, keywords, body, quote } = body
```

두 곳의 `.insert({...})` 블록(line 52~58 및 line 77~84)을 각각 아래로 교체 (qr_code_id 값만 다름):
```ts
// 첫 번째 insert (existingQr가 있을 때)
.insert({
  qr_code_id: existingQr.id,
  name: name.trim(),
  description: description ?? null,
  idus_url: idus_url ?? null,
  purchase_notes: purchase_notes ?? null,
  keywords: keywords ?? null,
  body: body ?? null,
  quote: quote ?? null,
})

// 두 번째 insert (새 qrCode 생성 후)
.insert({
  qr_code_id: qrCode.id,
  name: name.trim(),
  description: description ?? null,
  idus_url: idus_url ?? null,
  purchase_notes: purchase_notes ?? null,
  keywords: keywords ?? null,
  body: body ?? null,
  quote: quote ?? null,
})
```

---

- [ ] **Step 3: `app/api/qr/[id]/route.ts` PATCH 핸들러 수정**

Destructure 라인을 아래로 교체:
```ts
const { drive_folder_url, name, description, idus_url, purchase_notes, keywords, body, quote } = body
```

`productUpdates` 조건 블록(기존 4개 if 문 아래)에 3개 추가:
```ts
if (keywords !== undefined) productUpdates.keywords = keywords
if (body !== undefined) productUpdates.body = body
if (quote !== undefined) productUpdates.quote = quote
```

---

- [ ] **Step 4: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음 (GoldBorderCard.test.tsx의 pre-existing vitest 경고는 무시)

---

- [ ] **Step 5: 전체 테스트 회귀 확인**

```bash
npx vitest run
```

Expected: 전체 PASS (타입 변경은 기존 컴포넌트·테스트에 영향 없음 — 신규 필드는 모두 optional `null`)

---

- [ ] **Step 6: 커밋**

```bash
git add lib/types.ts app/api/qr/route.ts "app/api/qr/[id]/route.ts"
git commit -m "feat: add keywords, body, quote fields to Product type and API"
```

---

## Task 2: ProductLandingPage 재작성 (TDD)

**Files:**
- Modify: `__tests__/components/ProductLandingPage.test.tsx`
- Modify: `components/ProductLandingPage.tsx`

---

- [ ] **Step 1: 테스트 파일 전체 교체**

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
  description: '전통의 아름다움을 일상 속에',
  idus_url: 'https://www.idus.com/v2/product/abc123',
  purchase_notes: '핸드메이드 제품으로 색상·크기에 차이가 있습니다\n사진과 실물 색상이 다를 수 있습니다',
  keywords: '전통 소품,핸드메이드,선물 추천',
  body: '한국 전통 갓의 우아한 선과 품격을 작은 키링에 담았습니다.',
  quote: '작지만 오래 간직할 수 있는 전통의 가치',
}

describe('ProductLandingPage', () => {
  it('제품명이 h1으로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByRole('heading', { name: '레진 갓 키링' })).toBeInTheDocument()
  })

  it('description이 있으면 한 줄 카피로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('전통의 아름다움을 일상 속에')).toBeInTheDocument()
  })

  it('keywords가 쉼표로 분리되어 배지로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('전통 소품')).toBeInTheDocument()
    expect(screen.getByText('핸드메이드')).toBeInTheDocument()
    expect(screen.getByText('선물 추천')).toBeInTheDocument()
  })

  it('body가 있으면 작품 소개 카드가 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('작품 소개')).toBeInTheDocument()
    expect(
      screen.getByText('한국 전통 갓의 우아한 선과 품격을 작은 키링에 담았습니다.')
    ).toBeInTheDocument()
  })

  it('quote가 있으면 강조 문장이 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('작지만 오래 간직할 수 있는 전통의 가치')).toBeInTheDocument()
  })

  it('body와 quote 모두 없으면 작품 소개 카드가 없다', () => {
    render(<ProductLandingPage product={{ ...baseProduct, body: null, quote: null }} />)
    expect(screen.queryByText('작품 소개')).not.toBeInTheDocument()
  })

  it('purchase_notes가 줄바꿈으로 분리되어 각 항목이 별도로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('구매 전 확인사항')).toBeInTheDocument()
    expect(screen.getByText('핸드메이드 제품으로 색상·크기에 차이가 있습니다')).toBeInTheDocument()
    expect(screen.getByText('사진과 실물 색상이 다를 수 있습니다')).toBeInTheDocument()
  })

  it('idus_url이 있으면 구매하기 버튼과 작품 페이지 보기 버튼이 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByRole('link', { name: /아이디어스에서 구매하기/ })).toHaveAttribute(
      'href',
      'https://www.idus.com/v2/product/abc123'
    )
    expect(screen.getByRole('link', { name: /아이디어스 작품 페이지 보기/ })).toHaveAttribute(
      'href',
      'https://www.idus.com/v2/product/abc123'
    )
  })

  it('idus_url이 없으면 링크 없고 준비 중 안내가 표시된다', () => {
    render(<ProductLandingPage product={{ ...baseProduct, idus_url: null }} />)
    expect(screen.queryByRole('link', { name: /구매하기/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /작품 페이지 보기/ })).not.toBeInTheDocument()
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

---

- [ ] **Step 2: 테스트 실행해 실패 확인**

```bash
npx vitest run __tests__/components/ProductLandingPage.test.tsx
```

Expected: 일부 FAIL — keywords 배지, body/quote 카드, 링크 이름 변경 테스트가 실패해야 한다.

---

- [ ] **Step 3: `components/ProductLandingPage.tsx` 전체 교체**

```tsx
import type { Product } from '@/lib/types'

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

  const checkItems =
    product.purchase_notes
      ?.split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0) ?? []

  const keywords =
    product.keywords
      ?.split(',')
      .map((kw) => kw.trim())
      .filter((kw) => kw.length > 0) ?? []

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Hero */}
      <div className="bg-cream px-5 pt-8 pb-6">
        {product.description && (
          <p className="text-xs text-brown-mid tracking-wide mb-2">{product.description}</p>
        )}
        <h1 className="text-[32px] font-extrabold text-brown-dark leading-tight tracking-tight mb-4">
          {product.name}
        </h1>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="px-3 py-1 rounded-full bg-gold/10 text-gold text-[11px] font-medium border border-gold/20"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        {/* Primary CTA */}
        {product.idus_url ? (
          <a
            href={product.idus_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gold text-cream text-center font-bold py-4 rounded-2xl text-sm tracking-wide hover:opacity-90 transition-opacity"
          >
            아이디어스에서 구매하기 →
          </a>
        ) : (
          <p className="text-xs text-brown-muted text-center py-2">구매 링크 준비 중입니다</p>
        )}

        {/* Story card */}
        {(product.body || product.quote) && (
          <div className="bg-cream rounded-2xl px-5 py-5">
            <p className="text-[9px] font-bold tracking-[2.5px] text-gold uppercase mb-3">
              작품 소개
            </p>
            {product.body && (
              <p className="text-sm text-brown-dark leading-relaxed">{product.body}</p>
            )}
            {product.quote && (
              <p className="mt-4 text-base font-semibold text-brown-dark leading-snug">
                <span className="text-gold text-xl">&ldquo;</span>
                {product.quote}
                <span className="text-gold text-xl">&rdquo;</span>
              </p>
            )}
          </div>
        )}

        {/* Checklist card */}
        {checkItems.length > 0 && (
          <div className="bg-cream rounded-2xl px-5 py-5">
            <p className="text-[9px] font-bold tracking-[2.5px] text-gold uppercase mb-3">
              구매 전 확인사항
            </p>
            <ul className="flex flex-col gap-2.5">
              {checkItems.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-gold/20 flex-shrink-0 mt-0.5 flex items-center justify-center text-[9px] text-gold font-bold">
                    ✓
                  </span>
                  <span className="text-sm text-brown-dark leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA footer card */}
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

---

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/components/ProductLandingPage.test.tsx
```

Expected: 11/11 PASS

---

- [ ] **Step 5: 전체 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 전체 PASS

---

- [ ] **Step 6: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

---

- [ ] **Step 7: 커밋**

```bash
git add components/ProductLandingPage.tsx __tests__/components/ProductLandingPage.test.tsx
git commit -m "feat: redesign ProductLandingPage as poster-style card layout with keywords, body, quote"
```

---

## Task 3: Admin Form 업데이트

**Files:**
- Modify: `app/admin/qr/new/page.tsx`

---

- [ ] **Step 1: `app/admin/qr/new/page.tsx` 전체 교체**

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
  const [keywords, setKeywords] = useState('')
  const [body, setBody] = useState('')
  const [quote, setQuote] = useState('')
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
        keywords: keywords || null,
        body: body || null,
        quote: quote || null,
        idus_url: idusUrl || null,
        purchase_notes: purchaseNotes || null,
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
                    한 줄 카피{' '}
                    <span className="text-[11px] text-brown-muted font-normal">(선택 · 제품명 위에 표시)</span>
                  </label>
                  <input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="전통의 아름다움을 일상 속에"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="keywords" className={labelClass}>
                    키워드{' '}
                    <span className="text-[11px] text-brown-muted font-normal">(선택 · 쉼표로 구분)</span>
                  </label>
                  <input
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="전통 소품,핸드메이드,선물 추천"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="px-6 py-6 border-t border-gold/20">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">랜딩 페이지</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="body" className={labelClass}>
                    소개 본문{' '}
                    <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
                  </label>
                  <textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    placeholder="작품에 담긴 이야기를 2-3줄로 소개해주세요"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div>
                  <label htmlFor="quote" className={labelClass}>
                    강조 문장{' '}
                    <span className="text-[11px] text-brown-muted font-normal">(선택 · 큰따옴표로 강조 표시)</span>
                  </label>
                  <input
                    id="quote"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="작지만 오래 간직할 수 있는 전통의 가치"
                    className={inputClass}
                  />
                </div>

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
                    <span className="text-[11px] text-brown-muted font-normal">(선택 · 줄바꿈으로 항목 구분)</span>
                  </label>
                  <textarea
                    id="purchase-notes"
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                    rows={4}
                    placeholder={"핸드메이드 제품으로 색상·크기에 차이가 있을 수 있습니다\n사진과 실물 색상이 다를 수 있습니다"}
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

---

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

---

- [ ] **Step 3: 전체 테스트 회귀 확인**

```bash
npx vitest run
```

Expected: 전체 PASS (Admin form은 Client Component이므로 단위 테스트 없음, TypeScript 검증으로 대체)

---

- [ ] **Step 4: 커밋**

```bash
git add app/admin/qr/new/page.tsx
git commit -m "feat: add keywords, body, quote fields to admin QR creation form"
```
