# Product Landing Page v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 오프라인 매장 QR 스캔 고객을 위한 짧은 제품 안내 페이지 + 아이디어스 구매 버튼 연결

**Architecture:** `products` 테이블에 `idus_url`, `purchase_notes`, `hero_image_drive_id` 3개 컬럼 추가. 새 `ProductLandingPage` 서버 컴포넌트가 이 데이터를 받아 렌더링. `/r/[slug]` 라우트는 Drive 이미지/섹션 분기를 제거하고 `ProductLandingPage` 만 렌더링. 기존 `ProductDetailView`, `ProductPageView`는 파일 유지, 호출 제거.

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
| `app/admin/qr/new/page.tsx` | 새 입력 필드 3개 추가 |
| `e2e/qr.spec.ts` | E2E 테스트 추가 |

---

## Task 1: Supabase DB migration (수동 실행)

**Files:** Supabase SQL Editor (코드 변경 없음)

- [ ] **Step 1: Supabase 대시보드에서 SQL Editor 열기**

`https://supabase.com/dashboard/project/[프로젝트-ID]/sql/new` 접속

- [ ] **Step 2: 아래 SQL 실행**

```sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS idus_url text,
  ADD COLUMN IF NOT EXISTS purchase_notes text,
  ADD COLUMN IF NOT EXISTS hero_image_drive_id text;
```

- [ ] **Step 3: 컬럼 추가 확인**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

Expected: `idus_url`, `purchase_notes`, `hero_image_drive_id` 행이 보임

---

## Task 2: Product 타입 업데이트

**Files:**
- Modify: `lib/types.ts:1-20`

- [ ] **Step 1: `Product` 인터페이스에 3개 필드 추가**

`lib/types.ts` 의 `Product` 인터페이스를 다음과 같이 변경:

```ts
export interface Product {
  id: string
  qr_code_id: string
  name: string
  description: string | null
  price: string | null
  materials: string | null
  dimensions: string | null
  idus_url: string | null
  purchase_notes: string | null
  hero_image_drive_id: string | null
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없이 종료

- [ ] **Step 3: 커밋**

```bash
git add lib/types.ts
git commit -m "feat: add idus_url, purchase_notes, hero_image_drive_id to Product type"
```

---

## Task 3: ProductLandingPage 컴포넌트 (TDD)

**Files:**
- Create: `__tests__/components/ProductLandingPage.test.tsx`
- Create: `components/ProductLandingPage.tsx`

### Step 1: 테스트 먼저 작성

- [ ] **Step 1: 테스트 파일 생성**

`__tests__/components/ProductLandingPage.test.tsx` 를 아래 내용으로 생성:

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
  price: null,
  materials: null,
  dimensions: null,
  idus_url: 'https://www.idus.com/v2/product/abc123',
  purchase_notes: '핸드메이드 제품으로 색상·크기에 차이가 있을 수 있습니다.',
  hero_image_drive_id: null,
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

  it('hero_image_drive_id가 있으면 img src에 해당 id가 포함된다', () => {
    render(<ProductLandingPage product={{ ...baseProduct, hero_image_drive_id: 'imgABC' }} />)
    const img = screen.getByRole('img', { name: '레진 갓 키링' })
    expect(img.getAttribute('src')).toContain('imgABC')
  })

  it('hero_image_drive_id가 없으면 img가 없다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
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

`components/ProductLandingPage.tsx` 를 아래 내용으로 생성:

```tsx
import { driveThumbUrl } from '@/lib/drive'
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
        {product?.hero_image_drive_id && (
          <div className="mt-5">
            <img
              src={driveThumbUrl(product.hero_image_drive_id, 800)}
              alt={product.name}
              className="w-full aspect-[4/3] object-cover rounded-xl border border-gold/20"
            />
          </div>
        )}

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

Expected: 8/8 PASS

- [ ] **Step 5: 전체 테스트 확인**

```bash
npx vitest run
```

Expected: 전체 PASS (기존 테스트 회귀 없음)

- [ ] **Step 6: 커밋**

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

`app/r/[slug]/page.tsx` 를 아래 내용으로 교체:

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

현재 POST handler는 `name, description, price, materials, dimensions` 를 처리한다. 3개 필드를 추가한다.

- [ ] **Step 1: POST handler 수정**

`app/api/qr/route.ts` 의 POST 함수를 아래로 교체:

```ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    drive_folder_url,
    name,
    description,
    price,
    materials,
    dimensions,
    idus_url,
    purchase_notes,
    hero_image_drive_id,
  } = body

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
          price: price ?? null,
          materials: materials ?? null,
          dimensions: dimensions ?? null,
          idus_url: idus_url ?? null,
          purchase_notes: purchase_notes ?? null,
          hero_image_drive_id: hero_image_drive_id ?? null,
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
      price: price ?? null,
      materials: materials ?? null,
      dimensions: dimensions ?? null,
      idus_url: idus_url ?? null,
      purchase_notes: purchase_notes ?? null,
      hero_image_drive_id: hero_image_drive_id ?? null,
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
git commit -m "feat: accept idus_url, purchase_notes, hero_image_drive_id in POST /api/qr"
```

---

## Task 6: PATCH /api/qr/[id] route 수정

**Files:**
- Modify: `app/api/qr/[id]/route.ts:21-81`

- [ ] **Step 1: PATCH handler의 destructuring과 productUpdates 수정**

`app/api/qr/[id]/route.ts` 의 PATCH 함수에서:

1. destructuring 라인을 아래로 교체:

```ts
const { drive_folder_url, name, description, price, materials, dimensions, idus_url, purchase_notes, hero_image_drive_id } = body
```

2. `productUpdates` 블록에 3줄 추가 (`if (dimensions !== undefined)` 라인 바로 아래):

```ts
if (idus_url !== undefined) productUpdates.idus_url = idus_url
if (purchase_notes !== undefined) productUpdates.purchase_notes = purchase_notes
if (hero_image_drive_id !== undefined) productUpdates.hero_image_drive_id = hero_image_drive_id
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add app/api/qr/[id]/route.ts
git commit -m "feat: accept new product fields in PATCH /api/qr/[id]"
```

---

## Task 7: 어드민 QR 생성 폼 업데이트

**Files:**
- Modify: `app/admin/qr/new/page.tsx`

- [ ] **Step 1: `DriveUrlInput` import 추가**

파일 상단 import 블록에 추가:

```ts
import { DriveUrlInput } from '@/components/admin/sections/DriveUrlInput'
```

- [ ] **Step 2: state 3개 추가**

기존 `const [dimensions, setDimensions] = useState('')` 바로 아래에:

```ts
const [idusUrl, setIdusUrl] = useState('')
const [purchaseNotes, setPurchaseNotes] = useState('')
const [heroImageDriveId, setHeroImageDriveId] = useState('')
```

- [ ] **Step 3: fetch body에 3개 필드 추가**

`handleSubmit` 안의 `JSON.stringify({...})` 를 아래로 교체:

```ts
body: JSON.stringify({
  name,
  drive_folder_url: driveUrl,
  description: description || null,
  price: price || null,
  materials: materials || null,
  dimensions: dimensions || null,
  idus_url: idusUrl || null,
  purchase_notes: purchaseNotes || null,
  hero_image_drive_id: heroImageDriveId || null,
}),
```

- [ ] **Step 4: 폼에 새 섹션 추가**

제품 정보 `<section className="px-6 py-6 border-t border-gold/20">` 의 닫기 태그 `</section>` 바로 뒤, 하단 버튼 row `<div className="px-6 py-4 border-t border-gold/20 flex justify-end gap-2.5">` 바로 앞에 새 섹션 삽입:

```tsx
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

    <div>
      <label className={labelClass}>
        대표 이미지{' '}
        <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
      </label>
      <DriveUrlInput
        value={heroImageDriveId}
        onChange={setHeroImageDriveId}
        placeholder="https://drive.google.com/file/d/..."
      />
      <p className="text-[11px] text-brown-muted mt-1.5">
        Drive 파일 URL 또는 파일 ID. 없으면 이미지가 표시되지 않습니다.
      </p>
    </div>
  </div>
</section>
```

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add app/admin/qr/new/page.tsx
git commit -m "feat: add landing page fields to admin QR creation form"
```

---

## Task 8: E2E 테스트 추가

**Files:**
- Modify: `e2e/qr.spec.ts`

- [ ] **Step 1: 기존 테스트가 통과하는지 먼저 확인**

```bash
npx playwright test e2e/qr.spec.ts
```

Expected: 기존 5개 테스트 모두 PASS (기존 `/r/{slug}` 테스트는 heading만 확인하므로 변경 없이 통과)

- [ ] **Step 2: 새 테스트 2개 추가**

`e2e/qr.spec.ts` 파일 맨 끝에 아래 테스트 추가:

```ts
test('QR creation form has landing page fields', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByLabel('아이디어스 구매 링크', { exact: false })).toBeVisible()
  await expect(page.getByLabel('구매 전 확인사항', { exact: false })).toBeVisible()
  await expect(page.getByLabel('대표 이미지', { exact: false })).toBeVisible()
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

- [ ] **Step 3: 전체 E2E 테스트 실행**

```bash
npx playwright test e2e/qr.spec.ts
```

Expected: 7/7 PASS

- [ ] **Step 4: 커밋**

```bash
git add e2e/qr.spec.ts
git commit -m "test: add E2E tests for landing page fields and idus purchase button"
```

---

## 최종 검증

- [ ] **Vitest 전체 실행**

```bash
npx vitest run
```

Expected: 전체 PASS

- [ ] **E2E 전체 실행**

```bash
npx playwright test
```

Expected: 전체 PASS

- [ ] **TypeScript 컴파일 최종 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음
