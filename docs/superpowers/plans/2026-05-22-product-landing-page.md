# Product Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** QR 스캔 시 Drive 리다이렉트 대신 자체 제품 설명 페이지(사진·설명·가격·소재·크기)를 보여준다.

**Architecture:** `qr_codes`(인프라)와 `products`(콘텐츠)를 분리한 두 테이블 구조. `/r/[slug]`를 route handler에서 Server Component 페이지로 전환. Drive 폴더 이미지는 Google Drive API v3로 서버에서 조회한다.

**Tech Stack:** Next.js 16 App Router, Supabase, Google Drive API v3 (API Key), Tailwind CSS, Vitest, Playwright

---

## Git 브랜치 전략

이 프로젝트에서 따르는 브랜치 규칙:

| 브랜치 | 용도 | 예시 |
|--------|------|------|
| `main` | 프로덕션 (항상 배포 가능 상태) | |
| `feat/<name>` | 새 기능 개발 | `feat/product-landing-page` |
| `fix/<name>` | 버그 수정 | `fix/qr-slug-collision` |
| `hotfix/<name>` | 프로덕션 긴급 수정 | `hotfix/login-redirect-loop` |
| `chore/<name>` | 설정·의존성·리팩터링 | `chore/update-deps` |

**규칙:**
- 모든 작업은 별도 브랜치에서 진행 → PR → `main` 머지
- 브랜치명은 kebab-case 소문자
- 커밋 메시지 접두사: `feat:` `fix:` `chore:` `test:` `docs:` (Conventional Commits)
- 머지 후 브랜치 삭제

---

## 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `lib/types.ts` | QrCode 업데이트, Product 타입 추가 |
| `lib/supabase.ts` | products 테이블 타입 추가, qr_codes 타입 업데이트 |
| `lib/drive.ts` | 신규 — Drive 폴더 이미지 조회 |
| `__tests__/lib/drive.test.ts` | 신규 — drive.ts 단위 테스트 |
| `app/r/[slug]/route.ts` | 삭제 |
| `app/r/[slug]/page.tsx` | 신규 — 제품 페이지 Server Component |
| `components/ProductPageView.tsx` | 신규 — 제품 페이지 UI |
| `app/api/qr/route.ts` | POST: products 동시 생성, drive_url → drive_folder_url |
| `app/api/qr/[id]/route.ts` | PATCH: products 필드 수정 지원 |
| `app/admin/qr/new/page.tsx` | 신규 필드 폼 추가 |
| `app/admin/dashboard/page.tsx` | products 조인 쿼리 |
| `components/QrTable.tsx` | products 필드 사용 |
| `e2e/qr.spec.ts` | 302 테스트 제거, 제품 페이지 테스트 추가 |

---

## Task 1: 브랜치 준비

**Files:** (없음)

- [ ] **Step 1: feat/dashboard-qr-download를 main에 머지**

  GitHub에서 PR을 열어 `feat/dashboard-qr-download` → `main` 머지.
  또는 로컬에서:
  ```bash
  git checkout main
  git merge feat/dashboard-qr-download
  git push origin main
  ```

- [ ] **Step 2: 새 기능 브랜치 생성**

  ```bash
  git checkout main
  git pull origin main
  git checkout -b feat/product-landing-page
  ```

---

## Task 2: Supabase DB 마이그레이션 (수동)

**Files:** (코드 없음 — Supabase 대시보드에서 실행)

- [ ] **Step 1: Supabase SQL Editor에서 마이그레이션 실행**

  ```sql
  -- 1. drive_url 컬럼 rename
  ALTER TABLE qr_codes RENAME COLUMN drive_url TO drive_folder_url;

  -- 2. product_name 컬럼 제거 전 products 테이블 생성
  CREATE TABLE products (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id   uuid UNIQUE NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
    name         text NOT NULL,
    description  text,
    price        text,
    materials    text,
    dimensions   text
  );

  -- 3. 기존 product_name 데이터를 products 테이블로 이전
  INSERT INTO products (qr_code_id, name)
  SELECT id, product_name FROM qr_codes;

  -- 4. qr_codes에서 product_name 제거
  ALTER TABLE qr_codes DROP COLUMN product_name;
  ```

- [ ] **Step 2: 마이그레이션 결과 확인**

  Supabase Table Editor에서:
  - `qr_codes` 컬럼: `id`, `slug`, `drive_folder_url`, `created_at`
  - `products` 테이블 존재, 기존 데이터 이전됨

---

## Task 3: TypeScript 타입 업데이트

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: lib/types.ts 전체 교체**

  ```typescript
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
    price: string | null
    materials: string | null
    dimensions: string | null
  }

  export interface QrCodeWithProduct extends QrCode {
    products: Product | null
  }
  ```

- [ ] **Step 2: 빌드 에러 없는지 확인 (타입 변경 영향 범위 파악용)**

  ```bash
  npx tsc --noEmit 2>&1 | head -40
  ```

  Expected: 여러 에러 출력 (이후 태스크에서 순차 수정)

- [ ] **Step 3: 커밋**

  ```bash
  git add lib/types.ts
  git commit -m "feat: split QrCode and Product types for two-table design"
  ```

---

## Task 4: Supabase 클라이언트 타입 업데이트

**Files:**
- Modify: `lib/supabase.ts`

- [ ] **Step 1: lib/supabase.ts 전체 교체**

  ```typescript
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
          Insert: Omit<Product, 'id'> & Record<string, unknown>
          Update: Partial<Omit<Product, 'id'>> & Record<string, unknown>
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

- [ ] **Step 2: 커밋**

  ```bash
  git add lib/supabase.ts
  git commit -m "feat: add products table type to Supabase client"
  ```

---

## Task 5: Drive API 헬퍼 (TDD)

**Files:**
- Create: `lib/drive.ts`
- Create: `__tests__/lib/drive.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

  `__tests__/lib/drive.test.ts`:
  ```typescript
  // @vitest-environment node
  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
  import { getFolderImages } from '@/lib/drive'

  beforeEach(() => {
    process.env.GOOGLE_DRIVE_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getFolderImages', () => {
    it('유효한 폴더 URL에서 이미지 목록을 반환한다', async () => {
      const mockImages = [
        {
          id: 'img1',
          name: 'photo1.jpg',
          thumbnailLink: 'https://thumb1.example.com',
          webContentLink: 'https://content1.example.com',
        },
      ]
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ files: mockImages }),
      })

      const result = await getFolderImages(
        'https://drive.google.com/drive/folders/abc123XYZ'
      )

      expect(result).toEqual(mockImages)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('abc123XYZ'),
        expect.any(Object)
      )
    })

    it('폴더 URL이 아닌 경우 빈 배열을 반환한다', async () => {
      const result = await getFolderImages('https://drive.google.com/file/d/abc/view')
      expect(result).toEqual([])
    })

    it('Drive API 응답이 실패하면 빈 배열을 반환한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false })
      const result = await getFolderImages(
        'https://drive.google.com/drive/folders/abc123'
      )
      expect(result).toEqual([])
    })

    it('files 키가 없는 응답에서 빈 배열을 반환한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })
      const result = await getFolderImages(
        'https://drive.google.com/drive/folders/abc123'
      )
      expect(result).toEqual([])
    })
  })
  ```

- [ ] **Step 2: 테스트 실패 확인**

  ```bash
  npx vitest run __tests__/lib/drive.test.ts 2>&1 | tail -10
  ```

  Expected: FAIL — `Cannot find module '@/lib/drive'`

- [ ] **Step 3: lib/drive.ts 구현**

  ```typescript
  export interface DriveImage {
    id: string
    name: string
    thumbnailLink: string
    webContentLink: string
  }

  export async function getFolderImages(folderUrl: string): Promise<DriveImage[]> {
    const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/)
    if (!match) return []
    const folderId = match[1]

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files` +
        `?q=%27${folderId}%27+in+parents+and+mimeType+contains+%27image/%27` +
        `&fields=files(id,name,thumbnailLink,webContentLink)` +
        `&key=${process.env.GOOGLE_DRIVE_API_KEY}`,
      { next: { revalidate: 300 } } as RequestInit
    )

    if (!res.ok) return []
    const json = await res.json()
    return json.files ?? []
  }
  ```

- [ ] **Step 4: 테스트 통과 확인**

  ```bash
  npx vitest run __tests__/lib/drive.test.ts
  ```

  Expected: 4 tests passed

- [ ] **Step 5: 전체 단위 테스트 통과 확인**

  ```bash
  npx vitest run
  ```

  Expected: 모든 테스트 pass

- [ ] **Step 6: 커밋**

  ```bash
  git add lib/drive.ts __tests__/lib/drive.test.ts
  git commit -m "feat: add Drive folder image fetcher with tests"
  ```

---

## Task 6: 제품 페이지 UI 컴포넌트

**Files:**
- Create: `components/ProductPageView.tsx`

- [ ] **Step 1: components/ProductPageView.tsx 생성**

  ```typescript
  'use client'

  import { useState } from 'react'
  import type { Product } from '@/lib/types'
  import type { DriveImage } from '@/lib/drive'

  interface ProductPageViewProps {
    product: Product | null
    images: DriveImage[]
  }

  export function ProductPageView({ product, images }: ProductPageViewProps) {
    const [selectedImage, setSelectedImage] = useState<DriveImage | null>(null)

    if (!product) {
      return (
        <main className="max-w-2xl mx-auto p-8 text-center text-gray-500">
          제품 정보를 찾을 수 없습니다.
        </main>
      )
    }

    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">{product.name}</h1>

        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="aspect-square overflow-hidden rounded"
              >
                <img
                  src={img.thumbnailLink}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400 mb-6">
            사진 준비 중입니다.
          </div>
        )}

        {product.description && (
          <p className="text-gray-700 mb-6 whitespace-pre-wrap">{product.description}</p>
        )}

        {(product.price || product.materials || product.dimensions) && (
          <table className="w-full text-sm border-t">
            <tbody>
              {product.price && (
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left text-gray-500 w-20 font-medium">가격</th>
                  <td className="py-2">{product.price}</td>
                </tr>
              )}
              {product.materials && (
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left text-gray-500 w-20 font-medium">소재</th>
                  <td className="py-2">{product.materials}</td>
                </tr>
              )}
              {product.dimensions && (
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left text-gray-500 w-20 font-medium">크기</th>
                  <td className="py-2">{product.dimensions}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={`https://drive.google.com/uc?id=${selectedImage.id}`}
              alt={selectedImage.name}
              className="max-w-full max-h-full object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </main>
    )
  }
  ```

- [ ] **Step 2: 커밋**

  ```bash
  git add components/ProductPageView.tsx
  git commit -m "feat: add ProductPageView component with image gallery"
  ```

---

## Task 7: 제품 랜딩 페이지 라우트

**Files:**
- Delete: `app/r/[slug]/route.ts`
- Create: `app/r/[slug]/page.tsx`

- [ ] **Step 1: 기존 route.ts 삭제**

  ```bash
  rm app/r/[slug]/route.ts
  ```

- [ ] **Step 2: app/r/[slug]/page.tsx 생성**

  ```typescript
  import { notFound } from 'next/navigation'
  import { createServerSupabaseClient } from '@/lib/supabase'
  import { getFolderImages } from '@/lib/drive'
  import { ProductPageView } from '@/components/ProductPageView'

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

    const images = await getFolderImages(qrCode.drive_folder_url)

    return <ProductPageView product={product ?? null} images={images} />
  }
  ```

- [ ] **Step 3: 빌드 확인**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: 빌드 성공 (이 태스크의 파일 관련 에러 없음)

- [ ] **Step 4: 커밋**

  ```bash
  git add app/r/
  git commit -m "feat: replace redirect route with product landing page"
  ```

---

## Task 8: POST API 업데이트

**Files:**
- Modify: `app/api/qr/route.ts`

- [ ] **Step 1: app/api/qr/route.ts 전체 교체**

  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { createServerSupabaseClient } from '@/lib/supabase'
  import { computeSlug } from '@/lib/qr'

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
    const body = await request.json()
    const { drive_folder_url, name, description, price, materials, dimensions } = body

    if (!drive_folder_url?.startsWith('https://drive.google.com/')) {
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
      })
      .select()
      .single()

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    return NextResponse.json({ ...qrCode, products: product }, { status: 201 })
  }
  ```

- [ ] **Step 2: 커밋**

  ```bash
  git add app/api/qr/route.ts
  git commit -m "feat: update POST /api/qr to create products table entry"
  ```

---

## Task 9: PATCH API 업데이트

**Files:**
- Modify: `app/api/qr/[id]/route.ts`

- [ ] **Step 1: app/api/qr/[id]/route.ts 전체 교체**

  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { createServerSupabaseClient } from '@/lib/supabase'

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
    const body = await request.json()
    const { drive_folder_url, name, description, price, materials, dimensions } = body

    const supabase = createServerSupabaseClient()

    if (drive_folder_url !== undefined) {
      if (!drive_folder_url?.startsWith('https://drive.google.com/')) {
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
    if (price !== undefined) productUpdates.price = price
    if (materials !== undefined) productUpdates.materials = materials
    if (dimensions !== undefined) productUpdates.dimensions = dimensions

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

- [ ] **Step 2: 커밋**

  ```bash
  git add app/api/qr/[id]/route.ts
  git commit -m "feat: update PATCH /api/qr/[id] to support products fields"
  ```

---

## Task 10: 관리자 폼 업데이트

**Files:**
- Modify: `app/admin/qr/new/page.tsx`

- [ ] **Step 1: app/admin/qr/new/page.tsx 전체 교체**

  ```typescript
  'use client'

  import { useState } from 'react'
  import Link from 'next/link'
  import { QrDisplay } from '@/components/QrDisplay'
  import type { QrCode } from '@/lib/types'

  interface CreateResult extends QrCode {
    products: { id: string; name: string } | null
  }

  export default function NewQrPage() {
    const [name, setName] = useState('')
    const [driveUrl, setDriveUrl] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [materials, setMaterials] = useState('')
    const [dimensions, setDimensions] = useState('')
    const [result, setResult] = useState<CreateResult | null>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError('')
      setResult(null)

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
        setResult(data)
      } else {
        setError(data.error)
      }
      setLoading(false)
    }

    return (
      <main className="max-w-xl mx-auto p-8">
        <Link href="/admin/dashboard" className="text-blue-600 hover:underline text-sm">
          ← 목록으로
        </Link>
        <h1 className="text-2xl font-bold mt-4 mb-6">새 QR 코드 생성</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">제품명</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="drive-url" className="block text-sm font-medium mb-1">
              Google Drive 폴더 URL
            </label>
            <input
              id="drive-url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              설명 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                가격 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="₩15,000"
                className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="materials" className="block text-sm font-medium mb-1">
                소재 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <input
                id="materials"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="면 100%"
                className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="dimensions" className="block text-sm font-medium mb-1">
                크기 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <input
                id="dimensions"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="20×15cm"
                className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '생성 중...' : 'QR 생성'}
          </button>
        </form>

        {result && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">생성된 QR 코드</h2>
            <QrDisplay
              slug={result.slug}
              productName={result.products?.name ?? ''}
            />
          </div>
        )}
      </main>
    )
  }
  ```

- [ ] **Step 2: 커밋**

  ```bash
  git add app/admin/qr/new/page.tsx
  git commit -m "feat: update QR creation form with product detail fields"
  ```

---

## Task 11: 대시보드 및 QrTable 업데이트

**Files:**
- Modify: `app/admin/dashboard/page.tsx`
- Modify: `components/QrTable.tsx`

- [ ] **Step 1: app/admin/dashboard/page.tsx 전체 교체**

  ```typescript
  import Link from 'next/link'
  import { createServerSupabaseClient } from '@/lib/supabase'
  import { QrTable } from '@/components/QrTable'
  import { LogoutButton } from '@/components/LogoutButton'
  import type { QrCodeWithProduct } from '@/lib/types'

  export const dynamic = 'force-dynamic'

  export default async function DashboardPage() {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('qr_codes')
      .select('*, products(*)')
      .order('created_at', { ascending: false })

    return (
      <main className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">QR Code Manager</h1>
          <div className="flex gap-3 items-center">
            <Link
              href="/admin/qr/new"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              + 새 QR 생성
            </Link>
            <LogoutButton />
          </div>
        </div>
        <QrTable items={(data as QrCodeWithProduct[]) ?? []} />
      </main>
    )
  }
  ```

- [ ] **Step 2: components/QrTable.tsx 전체 교체**

  ```typescript
  'use client'

  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import QRCode from 'react-qr-code'
  import { QrDisplay } from '@/components/QrDisplay'
  import type { QrCodeWithProduct } from '@/lib/types'

  interface QrTableProps {
    items: QrCodeWithProduct[]
  }

  export function QrTable({ items }: QrTableProps) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const router = useRouter()

    const [editingItem, setEditingItem] = useState<QrCodeWithProduct | null>(null)
    const [downloadItem, setDownloadItem] = useState<QrCodeWithProduct | null>(null)
    const [newUrl, setNewUrl] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleDelete(item: QrCodeWithProduct) {
      const productName = item.products?.name ?? item.slug
      if (!confirm(`"${productName}" QR 코드를 삭제하시겠습니까?`)) return

      const res = await fetch(`/api/qr/${item.id}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    }

    function openEditModal(item: QrCodeWithProduct) {
      setEditingItem(item)
      setNewUrl(item.drive_folder_url)
      setError('')
    }

    function closeEditModal() {
      setEditingItem(null)
      setNewUrl('')
      setError('')
    }

    async function handleUpdate(e: React.FormEvent) {
      e.preventDefault()
      if (!editingItem) return
      setLoading(true)
      setError('')

      const res = await fetch(`/api/qr/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drive_folder_url: newUrl }),
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        setError(data.error)
        return
      }

      closeEditModal()
      router.refresh()
    }

    if (items.length === 0) {
      return (
        <p className="text-gray-500 text-center py-8">생성된 QR 코드가 없습니다.</p>
      )
    }

    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-medium">제품명</th>
                <th className="text-left p-3 font-medium">Slug</th>
                <th className="text-left p-3 font-medium">생성일</th>
                <th className="text-left p-3 font-medium">QR</th>
                <th className="text-left p-3 font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.products?.name ?? '-'}</td>
                  <td className="p-3 font-mono">{item.slug}</td>
                  <td className="p-3 text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="p-3">
                    <QRCode value={`${baseUrl}/r/${item.slug}`} size={64} />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDownloadItem(item)}
                        className="px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      >
                        다운로드
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        URL 변경
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="px-3 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {downloadItem && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setDownloadItem(null)}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold self-start">
                {downloadItem.products?.name ?? downloadItem.slug}
              </h2>
              <QrDisplay
                slug={downloadItem.slug}
                productName={downloadItem.products?.name ?? ''}
              />
              <button
                onClick={() => setDownloadItem(null)}
                className="w-full px-4 py-2 text-sm rounded border hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {editingItem && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={closeEditModal}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-1">Drive 폴더 URL 변경</h2>
              <p className="text-sm text-gray-500 mb-4">
                <span className="font-mono">{editingItem.slug}</span> — QR 코드 주소는 유지됩니다
              </p>
              <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 text-sm rounded border hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? '저장 중...' : '저장'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    )
  }
  ```

- [ ] **Step 3: 커밋**

  ```bash
  git add app/admin/dashboard/page.tsx components/QrTable.tsx
  git commit -m "feat: update dashboard and QrTable for two-table schema"
  ```

---

## Task 12: E2E 테스트 업데이트

**Files:**
- Modify: `e2e/qr.spec.ts`

- [ ] **Step 1: e2e/qr.spec.ts 전체 교체**

  ```typescript
  // e2e/qr.spec.ts
  // Auth cookie is injected via globalSetup (JWT_SECRET) — no login credentials needed.
  import { test, expect } from '@playwright/test'

  const TEST_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/e2e-test-folder-id'
  const TEST_PRODUCT_NAME = 'E2E Test Product'

  test('can access /admin/qr/new when authenticated', async ({ page }) => {
    await page.goto('/admin/qr/new')
    await expect(page.getByRole('heading', { name: '새 QR 코드 생성' })).toBeVisible()
  })

  test('QR creation form has product detail fields', async ({ page }) => {
    await page.goto('/admin/qr/new')
    await expect(page.getByLabel('제품명')).toBeVisible()
    await expect(page.getByLabel('Google Drive 폴더 URL')).toBeVisible()
    await expect(page.getByLabel('설명', { exact: false })).toBeVisible()
    await expect(page.getByLabel('가격', { exact: false })).toBeVisible()
    await expect(page.getByLabel('소재', { exact: false })).toBeVisible()
    await expect(page.getByLabel('크기', { exact: false })).toBeVisible()
  })

  test('invalid URL shows error', async ({ page }) => {
    await page.goto('/admin/qr/new')
    await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
    await page.getByLabel('Google Drive 폴더 URL').fill('https://not-drive.com/file')
    await page.getByRole('button', { name: 'QR 생성' }).click()
    await expect(page.getByText('유효한 Google Drive 링크가 아닙니다')).toBeVisible()
  })

  test('valid Drive folder URL creates QR SVG', async ({ page }) => {
    await page.goto('/admin/qr/new')
    await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
    await page.getByLabel('Google Drive 폴더 URL').fill(TEST_DRIVE_FOLDER_URL)
    await page.getByRole('button', { name: 'QR 생성' }).click()
    await expect(page.locator('svg').first()).toBeVisible()
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

  test('/r/{slug} shows product landing page', async ({ page }) => {
    const createRes = await page.request.post('/api/qr', {
      data: { name: TEST_PRODUCT_NAME, drive_folder_url: TEST_DRIVE_FOLDER_URL },
    })
    const { slug } = await createRes.json()

    await page.goto(`/r/${slug}`)
    await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()
  })
  ```

- [ ] **Step 2: 커밋**

  ```bash
  git add e2e/qr.spec.ts
  git commit -m "test: update E2E tests for product landing page"
  ```

---

## Task 13: 최종 빌드 확인 및 환경변수 문서화

**Files:**
- Modify: `.env.local.example`

- [ ] **Step 1: 전체 빌드 확인**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: 빌드 성공, 에러 없음

- [ ] **Step 2: 전체 단위 테스트 확인**

  ```bash
  npx vitest run
  ```

  Expected: 모든 테스트 pass

- [ ] **Step 3: .env.local.example 업데이트**

  ```
  JWT_SECRET=your_random_32_char_secret_minimum
  NEXT_PUBLIC_BASE_URL=http://localhost:3000
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  GOOGLE_DRIVE_API_KEY=your_google_drive_api_key
  ```

- [ ] **Step 4: 최종 커밋 및 PR**

  ```bash
  git add .env.local.example
  git commit -m "chore: add GOOGLE_DRIVE_API_KEY to env example"

  git push origin feat/product-landing-page
  # GitHub에서 feat/product-landing-page → main PR 생성
  ```

---

## 수동 설정 체크리스트 (구현 전 완료 필요)

- [ ] Google Cloud Console → 프로젝트 생성
- [ ] Google Drive API 활성화
- [ ] API 키 발급 (Drive API로 제한 설정 권장)
- [ ] `.env.local`에 `GOOGLE_DRIVE_API_KEY` 추가
- [ ] Vercel 환경변수에 `GOOGLE_DRIVE_API_KEY` 추가
- [ ] Supabase SQL Editor에서 Task 2의 마이그레이션 SQL 실행
- [ ] Drive 폴더 공유 설정: "링크 있는 모든 사용자" → 뷰어
