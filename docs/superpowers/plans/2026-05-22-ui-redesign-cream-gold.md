# UI/UX Redesign — Cream & Gold 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전체 앱(랜딩 페이지·대시보드·생성 폼)을 크림 & 골드 전통 공예 테마로 재디자인한다.

**Architecture:** Tailwind v4 `@theme inline`에 브랜드 컬러 토큰을 추가하고, `next/font/google`로 Noto Serif KR을 로드한다. 공통 UI인 골드 모서리 장식 카드를 `GoldBorderCard` 컴포넌트로 추출하고, 각 페이지 컴포넌트를 전면 재작성한다.

**Tech Stack:** Next.js 16, Tailwind v4 (`@theme inline`), Noto Serif KR (`next/font/google`), `@testing-library/react` + Vitest (jsdom), Playwright E2E

---

## 파일 구조

| 파일 | 변경 | 역할 |
|------|------|------|
| `app/globals.css` | 수정 | 브랜드 컬러 토큰, body 스타일 교체 |
| `app/layout.tsx` | 수정 | Noto Serif KR 폰트 로드 |
| `components/GoldBorderCard.tsx` | **신규** | 골드 모서리 장식 카드 컴포넌트 |
| `components/ProductPageView.tsx` | 전면 재작성 | 태그 카드 + 갤러리 레이아웃 |
| `components/QrDisplay.tsx` | 수정 | 크림/골드 스타일 다운로드 카드 |
| `components/LogoutButton.tsx` | 수정 | ghost 버튼 스타일 |
| `components/QrTable.tsx` | 전면 재작성 | 카드 리스트 + 모달 |
| `app/admin/dashboard/page.tsx` | 수정 | 크림/골드 nav + 레이아웃 |
| `app/admin/qr/new/page.tsx` | 전면 재작성 | 섹션 구분 폼 |
| `__tests__/components/GoldBorderCard.test.tsx` | **신규** | 컴포넌트 렌더 테스트 |
| `__tests__/components/ProductPageView.test.tsx` | **신규** | null·데이터 상태 테스트 |
| `__tests__/components/QrTable.test.tsx` | **신규** | 빈 상태·아이템 렌더 테스트 |

---

## Task 1: 브랜드 토큰 + Noto Serif KR 폰트

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: globals.css 교체**

```css
/* app/globals.css */
@import "tailwindcss";

@theme inline {
  --color-cream: #F5EFE0;
  --color-cream-bg: #EEEAE0;
  --color-gold: #C9A84C;
  --color-brown-dark: #3D2B1F;
  --color-brown-mid: #5C4A36;
  --color-brown-light: #8B6F3E;
  --color-brown-muted: #A08060;
}

body {
  font-family: var(--font-serif), 'Noto Serif KR', Georgia, serif;
  background-color: #EEEAE0;
  color: #3D2B1F;
}
```

기존 `--background`, `--foreground`, `@media (prefers-color-scheme: dark)` 블록은 모두 제거한다.

- [ ] **Step 2: layout.tsx에 Noto Serif KR 로드**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Noto_Serif_KR } from 'next/font/google'
import './globals.css'

const notoSerifKR = Noto_Serif_KR({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'QR Code Manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSerifKR.variable}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: 기존 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 5 tests pass (drive.test.ts 전부 통과)

- [ ] **Step 4: 커밋**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: add cream/gold brand tokens and Noto Serif KR font"
```

---

## Task 2: GoldBorderCard 컴포넌트

**Files:**
- Create: `components/GoldBorderCard.tsx`
- Create: `__tests__/components/GoldBorderCard.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
// __tests__/components/GoldBorderCard.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { GoldBorderCard } from '@/components/GoldBorderCard'

describe('GoldBorderCard', () => {
  it('renders children', () => {
    render(<GoldBorderCard><span>Test content</span></GoldBorderCard>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies additional className', () => {
    const { container } = render(
      <GoldBorderCard className="p-5">content</GoldBorderCard>
    )
    expect(container.firstChild).toHaveClass('p-5')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run __tests__/components/GoldBorderCard.test.tsx
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: GoldBorderCard 구현**

```tsx
// components/GoldBorderCard.tsx
import { ReactNode } from 'react'

interface GoldBorderCardProps {
  children: ReactNode
  className?: string
}

export function GoldBorderCard({ children, className = '' }: GoldBorderCardProps) {
  return (
    <div className={`relative border border-gold rounded-xl bg-cream ${className}`}>
      <span className="absolute top-[5px] left-[5px] w-3 h-3 border-t-2 border-l-2 border-gold pointer-events-none" />
      <span className="absolute top-[5px] right-[5px] w-3 h-3 border-t-2 border-r-2 border-gold pointer-events-none" />
      <span className="absolute bottom-[5px] left-[5px] w-3 h-3 border-b-2 border-l-2 border-gold pointer-events-none" />
      <span className="absolute bottom-[5px] right-[5px] w-3 h-3 border-b-2 border-r-2 border-gold pointer-events-none" />
      {children}
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/components/GoldBorderCard.test.tsx
```

Expected: 2 tests pass

- [ ] **Step 5: 커밋**

```bash
git add components/GoldBorderCard.tsx __tests__/components/GoldBorderCard.test.tsx
git commit -m "feat: add GoldBorderCard shared component"
```

---

## Task 3: ProductPageView 재작성

**Files:**
- Modify: `components/ProductPageView.tsx`
- Create: `__tests__/components/ProductPageView.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
// __tests__/components/ProductPageView.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { ProductPageView } from '@/components/ProductPageView'
import type { Product } from '@/lib/types'

const product: Product = {
  id: '1',
  qr_code_id: 'qr1',
  name: '레진 갓 키링',
  description: '전통 키링',
  price: '27,000원',
  materials: '레진',
  dimensions: '4.5cm',
}

describe('ProductPageView', () => {
  it('renders not-found message when product is null', () => {
    render(<ProductPageView product={null} images={[]} />)
    expect(screen.getByText('제품 정보를 찾을 수 없습니다.')).toBeInTheDocument()
  })

  it('renders product name as heading', () => {
    render(<ProductPageView product={product} images={[]} />)
    expect(screen.getByRole('heading', { name: '레진 갓 키링' })).toBeInTheDocument()
  })

  it('renders empty gallery message when no images', () => {
    render(<ProductPageView product={product} images={[]} />)
    expect(screen.getByText('사진 준비 중입니다.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run __tests__/components/ProductPageView.test.tsx
```

Expected: FAIL — 기존 구현은 heading role이 없고 "제품 정보를 찾을 수 없습니다."의 마크업이 다름

- [ ] **Step 3: ProductPageView 전면 재작성**

```tsx
// components/ProductPageView.tsx
'use client'

import { useState } from 'react'
import type { Product } from '@/lib/types'
import type { DriveImage } from '@/lib/drive'
import { driveThumbUrl } from '@/lib/drive'
import { GoldBorderCard } from '@/components/GoldBorderCard'

interface ProductPageViewProps {
  product: Product | null
  images: DriveImage[]
}

export function ProductPageView({ product, images }: ProductPageViewProps) {
  const [selectedImage, setSelectedImage] = useState<DriveImage | null>(null)

  if (!product) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center">
        <p className="text-brown-light">제품 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const heroImage = images[0] ?? null

  return (
    <div className="min-h-screen bg-cream-bg">
      <header className="border-b border-gold/30 py-4 text-center">
        <span className="text-[11px] tracking-[4px] text-gold uppercase">작품 이야기</span>
      </header>

      <main className="max-w-[480px] mx-auto px-4 py-6 space-y-5">
        <GoldBorderCard className="p-5">
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-brown-dark leading-tight">{product.name}</h1>
              <div className="w-7 h-px bg-gold my-3" />
              {product.description && (
                <p className="text-sm text-brown-mid leading-relaxed mb-3">{product.description}</p>
              )}
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
            </div>
            {heroImage ? (
              <button
                className="w-[130px] flex-shrink-0"
                onClick={() => setSelectedImage(heroImage)}
              >
                <img
                  src={driveThumbUrl(heroImage.id)}
                  alt={heroImage.name}
                  className="w-full aspect-[3/4] object-cover rounded-lg border border-gold/30"
                />
              </button>
            ) : (
              <div className="w-[130px] h-[173px] flex-shrink-0 bg-cream rounded-lg border border-dashed border-gold/30" />
            )}
          </div>
        </GoldBorderCard>

        {images.length > 0 ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <hr className="flex-1 border-gold/30" />
              <span className="text-[9px] tracking-[3px] text-gold uppercase">Gallery</span>
              <hr className="flex-1 border-gold/30" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className="aspect-square overflow-hidden rounded-md border border-gold/20 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={driveThumbUrl(img.id)}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-cream rounded-lg border border-dashed border-gold/30 py-10 text-center">
            <p className="text-sm text-brown-muted">사진 준비 중입니다.</p>
          </div>
        )}

        <footer className="text-center text-[9px] tracking-[2px] text-gold/60 pb-4">
          © 작품 이야기
        </footer>
      </main>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={driveThumbUrl(selectedImage.id, 2000)}
            alt={selectedImage.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/components/ProductPageView.test.tsx
```

Expected: 3 tests pass

- [ ] **Step 5: 커밋**

```bash
git add components/ProductPageView.tsx __tests__/components/ProductPageView.test.tsx
git commit -m "feat: redesign ProductPageView with cream/gold tag card layout"
```

---

## Task 4: QrDisplay 업데이트

**Files:**
- Modify: `components/QrDisplay.tsx`

- [ ] **Step 1: QrDisplay 스타일 업데이트**

```tsx
// components/QrDisplay.tsx
'use client'

import { useRef } from 'react'
import QRCode from 'react-qr-code'

interface QrDisplayProps {
  slug: string
  productName: string
}

export function QrDisplay({ slug, productName }: QrDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const qrValue = `${process.env.NEXT_PUBLIC_BASE_URL}/r/${slug}`

  const handleDownload = () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const size = 256

    canvas.width = size
    canvas.height = size

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#F5EFE0'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${productName}-qr.png`
      link.click()
    }
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white border border-gold/40 rounded-xl">
      <div ref={containerRef} className="p-3 bg-cream rounded-lg">
        <QRCode value={qrValue} size={200} fgColor="#3D2B1F" bgColor="#F5EFE0" />
      </div>
      <button
        onClick={handleDownload}
        className="px-5 py-2 bg-gold text-cream font-bold rounded-lg text-sm hover:bg-gold/90 transition-colors"
      >
        PNG 다운로드
      </button>
    </div>
  )
}
```

- [ ] **Step 2: 기존 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 5 tests pass (모두 통과)

- [ ] **Step 3: 커밋**

```bash
git add components/QrDisplay.tsx
git commit -m "feat: update QrDisplay to cream/gold style"
```

---

## Task 5: LogoutButton 업데이트

**Files:**
- Modify: `components/LogoutButton.tsx`

- [ ] **Step 1: LogoutButton 스타일 업데이트**

```tsx
// components/LogoutButton.tsx
'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs border border-gold/40 text-brown-light rounded-md px-3 py-1.5 hover:bg-gold/10 transition-colors"
    >
      로그아웃
    </button>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/LogoutButton.tsx
git commit -m "feat: update LogoutButton to cream/gold ghost style"
```

---

## Task 6: QrTable 재작성

**Files:**
- Modify: `components/QrTable.tsx`
- Create: `__tests__/components/QrTable.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
// __tests__/components/QrTable.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { QrTable } from '@/components/QrTable'
import type { QrCodeWithProduct } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('react-qr-code', () => ({
  default: () => <svg data-testid="qr-code" />,
}))

const mockItem: QrCodeWithProduct = {
  id: '1',
  slug: 'test-slug',
  drive_folder_url: 'https://drive.google.com/drive/folders/abc',
  created_at: '2025-01-01T00:00:00Z',
  products: {
    id: 'p1',
    qr_code_id: '1',
    name: '레진 갓 키링',
    description: null,
    price: null,
    materials: null,
    dimensions: null,
  },
}

describe('QrTable', () => {
  it('renders empty state when no items', () => {
    render(<QrTable items={[]} />)
    expect(screen.getByText('생성된 QR 코드가 없습니다.')).toBeInTheDocument()
  })

  it('renders product name for each item', () => {
    render(<QrTable items={[mockItem]} />)
    expect(screen.getByText('레진 갓 키링')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<QrTable items={[mockItem]} />)
    expect(screen.getByRole('link', { name: '미리보기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'URL 변경' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run __tests__/components/QrTable.test.tsx
```

Expected: FAIL — 기존 테이블 구조는 `link` role로 "미리보기"가 없음 (Link 컴포넌트 렌더 차이)

- [ ] **Step 3: QrTable 전면 재작성**

```tsx
// components/QrTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    if (!res.ok) { setError(data.error); return }
    closeEditModal()
    router.refresh()
  }

  if (items.length === 0) {
    return (
      <div className="bg-cream border border-dashed border-gold/40 rounded-xl py-12 text-center">
        <p className="text-sm text-brown-muted">생성된 QR 코드가 없습니다.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-cream border border-gold/40 rounded-xl px-4 py-3.5 flex items-center gap-3.5"
          >
            <button
              onClick={() => setDownloadItem(item)}
              className="w-12 h-12 bg-white border border-gold/30 rounded-lg flex-shrink-0 flex items-center justify-center hover:opacity-70 transition-opacity"
              title="클릭하여 다운로드"
            >
              <QRCode value={`${baseUrl}/r/${item.slug}`} size={36} />
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brown-dark truncate">
                {item.products?.name ?? '-'}
              </p>
              <p className="text-xs text-brown-light font-mono mt-0.5">
                {item.slug} · {new Date(item.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>

            <div className="flex gap-1.5 flex-shrink-0">
              <Link
                href={`/r/${item.slug}`}
                target="_blank"
                className="text-[10px] px-2.5 py-1 rounded bg-cream-bg text-brown-light border border-gold/30 hover:bg-gold/10 transition-colors"
              >
                미리보기
              </Link>
              <button
                onClick={() => setDownloadItem(item)}
                className="text-[10px] px-2.5 py-1 rounded bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition-colors"
              >
                다운로드
              </button>
              <button
                onClick={() => openEditModal(item)}
                className="text-[10px] px-2.5 py-1 rounded bg-cream-bg text-brown-light border border-gold/30 hover:bg-gold/10 transition-colors"
              >
                URL 변경
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="text-[10px] px-2.5 py-1 rounded bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {downloadItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setDownloadItem(null)}
        >
          <div
            className="bg-cream border border-gold rounded-xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-brown-dark self-start">
              {downloadItem.products?.name ?? downloadItem.slug}
            </h2>
            <QrDisplay
              slug={downloadItem.slug}
              productName={downloadItem.products?.name ?? ''}
            />
            <button
              onClick={() => setDownloadItem(null)}
              className="w-full px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {editingItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeEditModal}
        >
          <div
            className="bg-cream border border-gold rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-brown-dark mb-1">Drive 폴더 URL 변경</h2>
            <p className="text-xs text-brown-light mb-4 font-mono">{editingItem.slug}</p>
            <form onSubmit={handleUpdate} className="flex flex-col gap-3">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
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
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/components/QrTable.test.tsx
```

Expected: 3 tests pass

- [ ] **Step 5: 전체 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 13 tests pass (drive 5 + GoldBorderCard 2 + ProductPageView 3 + QrTable 3)

- [ ] **Step 6: 커밋**

```bash
git add components/QrTable.tsx __tests__/components/QrTable.test.tsx
git commit -m "feat: redesign QrTable as card list with cream/gold theme"
```

---

## Task 7: 관리자 대시보드 레이아웃 업데이트

**Files:**
- Modify: `app/admin/dashboard/page.tsx`

- [ ] **Step 1: dashboard/page.tsx 업데이트**

```tsx
// app/admin/dashboard/page.tsx
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

  const items = (data as unknown as QrCodeWithProduct[]) ?? []

  return (
    <div className="min-h-screen bg-cream-bg">
      <nav className="bg-cream border-b border-gold/30 px-6 py-3.5">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-base font-bold text-brown-dark block">QR 관리</span>
            <span className="text-[8px] tracking-[3px] text-gold">ADMIN DASHBOARD</span>
          </div>
          <div className="flex gap-2 items-center">
            <Link
              href="/admin/qr/new"
              className="bg-gold text-cream text-xs font-semibold px-3.5 py-1.5 rounded-md hover:bg-gold/90 transition-colors"
            >
              + 새 QR 코드
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex justify-between items-end mb-5">
          <h1 className="text-xl font-bold text-brown-dark">QR 코드 목록</h1>
          <span className="text-xs text-brown-light tracking-wide">{items.length} items</span>
        </div>
        <QrTable items={items} />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/admin/dashboard/page.tsx
git commit -m "feat: update dashboard layout with cream/gold nav"
```

---

## Task 8: QR 생성 폼 재작성

**Files:**
- Modify: `app/admin/qr/new/page.tsx`

E2E 셀렉터 유지 필수:
- `getByRole('heading', { name: '새 QR 코드 생성' })` → nav 내부 `<h1>새 QR 코드 생성</h1>`
- `getByLabel('제품명')` → `htmlFor="name"`
- `getByLabel('Google Drive 폴더 URL')` → `htmlFor="drive-url"`
- `getByLabel('설명', { exact: false })` → `htmlFor="description"`, label text "설명 (선택)"
- `getByLabel('가격', { exact: false })` → `htmlFor="price"`
- `getByLabel('소재', { exact: false })` → `htmlFor="materials"`
- `getByLabel('크기', { exact: false })` → `htmlFor="dimensions"`
- `getByRole('button', { name: 'QR 생성' })` → `type="submit"`, text "QR 생성"

- [ ] **Step 1: page.tsx 전면 재작성**

```tsx
// app/admin/qr/new/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GoldBorderCard } from '@/components/GoldBorderCard'
import { QrDisplay } from '@/components/QrDisplay'
import type { QrCode } from '@/lib/types'

interface CreateResult extends QrCode {
  products: { id: string; name: string } | null
}

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'

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
                  <p className="text-[11px] text-brown-muted mt-1.5">
                    QR 코드 URL(slug)이 제품명 기반으로 자동 생성됩니다.
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className={labelClass}>
                    설명 <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="price" className={labelClass}>
                      가격 <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
                    </label>
                    <input
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="27,000원"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="materials" className={labelClass}>
                      소재 <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
                    </label>
                    <input
                      id="materials"
                      value={materials}
                      onChange={(e) => setMaterials(e.target.value)}
                      placeholder="레진, 메탈"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dimensions" className={labelClass}>
                    크기 <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
                  </label>
                  <input
                    id="dimensions"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="4.5 × 3.2 cm"
                    className={inputClass}
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

        {result && (
          <div className="mt-6">
            <GoldBorderCard className="p-6 flex flex-col items-center gap-4">
              <h2 className="text-base font-bold text-brown-dark self-start">생성된 QR 코드</h2>
              <QrDisplay
                slug={result.slug}
                productName={result.products?.name ?? ''}
              />
            </GoldBorderCard>
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: 전체 유닛 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 13 tests pass

- [ ] **Step 3: 커밋**

```bash
git add app/admin/qr/new/page.tsx
git commit -m "feat: redesign QR creation form with cream/gold sectioned layout"
```

---

## Task 9: E2E 검증

**Files:** 없음 (기존 `e2e/qr.spec.ts` 실행)

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

브라우저에서 직접 확인:
- `http://localhost:3000/admin/dashboard` — 크림/골드 nav, 카드 리스트
- `http://localhost:3000/admin/qr/new` — 섹션 구분 폼, 세리프 폰트
- QR 하나를 생성한 뒤 `/r/[slug]` — 태그 카드 레이아웃, 갤러리

- [ ] **Step 2: E2E 테스트 실행**

```bash
npx playwright test
```

Expected: 6 tests pass
- `can access /admin/qr/new when authenticated` ✓ (h1 "새 QR 코드 생성" 존재)
- `QR creation form has product detail fields` ✓ (레이블 모두 존재)
- `invalid URL shows error` ✓ (에러 메시지 표시)
- `valid Drive folder URL creates QR SVG` ✓ (SVG 표시)
- `same Drive folder URL returns same slug` ✓ (API 로직 변경 없음)
- `/r/{slug} shows product landing page` ✓ (h1 product name 존재)

- [ ] **Step 3: 모든 커밋 확인**

```bash
git log --oneline -9
```

Expected: Task 1~8에서 생성된 커밋 8개가 모두 보임. 미커밋 파일이 없으면 완료.
