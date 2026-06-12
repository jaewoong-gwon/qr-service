# 랜딩 페이지 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전체 앱의 폰트를 Pretendard로 교체하고 색상 토큰을 웜 스톤/테라코타 팔레트로 갱신한 뒤, 랜딩 페이지를 에디토리얼 레이아웃(인라인 CTA + 체크리스트)으로 재구성한다.

**Architecture:** 색상 토큰과 폰트는 `app/globals.css` + `app/layout.tsx` 전역 변경으로 어드민/랜딩 모두 자동 적용된다. `ProductLandingPage` 컴포넌트는 전체 재작성이며 DB 스키마는 변경하지 않는다. `purchase_notes`는 `\n` 분리로 런타임에서 체크리스트로 렌더링한다.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, Pretendard (CDN), Vitest + React Testing Library

---

## 파일 구조

| 파일 | 작업 |
|------|------|
| `app/globals.css` | 색상 토큰 7개 값 교체 + `font-family` 선언 수정 |
| `app/layout.tsx` | Gowun_Dodum 제거 → Pretendard CDN `<link>` 삽입 |
| `components/ProductLandingPage.tsx` | 전체 재작성 (새 레이아웃) |
| `__tests__/components/ProductLandingPage.test.tsx` | 체크리스트 분리·보조 링크 테스트로 업데이트 |

---

## Task 1: 색상 토큰 + 폰트 교체

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

---

- [ ] **Step 1: `app/globals.css` 전체 교체**

```css
@import "tailwindcss";

@theme inline {
  --color-cream:       #F4F2EF;
  --color-cream-bg:    #EEECE8;
  --color-gold:        #C07A50;
  --color-brown-dark:  #1C1917;
  --color-brown-mid:   #6B5C4E;
  --color-brown-light: #9A8270;
  --color-brown-muted: #B09880;
}

body {
  font-family: 'Pretendard', -apple-system, 'Helvetica Neue', sans-serif;
  background-color: var(--color-cream-bg);
  color: var(--color-brown-dark);
}
```

> `var(--font-serif)` 참조 제거 — `--font-serif` 변수는 다음 단계에서 layout.tsx를 바꾸면 더 이상 주입되지 않는다.

---

- [ ] **Step 2: `app/layout.tsx` 전체 교체**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QR Code Manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

> `Gowun_Dodum` import와 `gowunDodum.variable` className 완전 제거.

---

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없이 종료 (GoldBorderCard.test.tsx의 pre-existing vitest 타입 경고는 무시)

---

- [ ] **Step 4: 기존 테스트 회귀 확인**

```bash
npx vitest run
```

Expected: 전체 PASS (폰트·색상 변경은 CSS이므로 단위 테스트에 영향 없음)

---

- [ ] **Step 5: 커밋**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: replace Gowun Dodum with Pretendard, update color tokens to warm stone/terracotta"
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
  description: '전통 갓의 아름다움을 담은 레진 키링',
  idus_url: 'https://www.idus.com/v2/product/abc123',
  purchase_notes: '핸드메이드 제품으로 색상·크기에 차이가 있습니다\n사진과 실물 색상이 다를 수 있습니다\n교환·환불은 아이디어스 정책을 따릅니다',
}

describe('ProductLandingPage', () => {
  it('제품명이 h1으로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByRole('heading', { name: '레진 갓 키링' })).toBeInTheDocument()
  })

  it('description이 있으면 한 줄 소개로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('전통 갓의 아름다움을 담은 레진 키링')).toBeInTheDocument()
  })

  it('purchase_notes가 줄바꿈으로 분리되어 각 항목이 별도로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('구매 전 확인사항')).toBeInTheDocument()
    expect(screen.getByText('핸드메이드 제품으로 색상·크기에 차이가 있습니다')).toBeInTheDocument()
    expect(screen.getByText('사진과 실물 색상이 다를 수 있습니다')).toBeInTheDocument()
    expect(screen.getByText('교환·환불은 아이디어스 정책을 따릅니다')).toBeInTheDocument()
  })

  it('idus_url이 있으면 구매하기 링크와 자세히 보기 링크가 모두 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByRole('link', { name: /아이디어스에서 구매하기/ })).toHaveAttribute(
      'href',
      'https://www.idus.com/v2/product/abc123'
    )
    expect(screen.getByRole('link', { name: /아이디어스에서 자세히 보기/ })).toHaveAttribute(
      'href',
      'https://www.idus.com/v2/product/abc123'
    )
  })

  it('idus_url이 없으면 링크 없고 준비 중 안내가 표시된다', () => {
    render(<ProductLandingPage product={{ ...baseProduct, idus_url: null }} />)
    expect(screen.queryByRole('link', { name: /아이디어스에서 구매하기/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /자세히 보기/ })).not.toBeInTheDocument()
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

Expected: 일부 FAIL — 체크리스트 분리 테스트, 자세히 보기 링크 테스트가 실패해야 한다.

---

- [ ] **Step 3: `components/ProductLandingPage.tsx` 전체 교체**

```tsx
import type { Product } from '@/lib/types'

interface ProductLandingPageProps {
  product: Product | null
}

export function ProductLandingPage({ product }: ProductLandingPageProps) {
  const checkItems =
    product?.purchase_notes
      ?.split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0) ?? []

  return (
    <div className="min-h-screen bg-cream-bg">
      <header className="border-b border-gold/20 px-5 py-3 flex items-center gap-3">
        <span className="text-[9px] font-bold tracking-[2.5px] text-gold uppercase">
          작품 이야기
        </span>
        <div className="w-px h-3 bg-brown-light/30" />
        <span className="text-[9px] text-brown-light/60 truncate">
          {product?.name ?? ''}
        </span>
      </header>

      <main className="max-w-[480px] mx-auto px-5 py-6">
        <h1 className="text-[26px] font-extrabold text-brown-dark leading-tight tracking-tight mb-2">
          {product?.name ?? '제품 정보 없음'}
        </h1>

        {product?.description && (
          <p className="text-sm text-brown-mid leading-relaxed mb-6">
            {product.description}
          </p>
        )}

        {product?.idus_url ? (
          <a
            href={product.idus_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gold text-cream text-center font-bold py-3.5 rounded-xl text-sm tracking-wide hover:opacity-90 transition-opacity mb-8"
          >
            아이디어스에서 구매하기 →
          </a>
        ) : (
          <p className="text-xs text-brown-muted text-center mb-8">구매 링크 준비 중입니다</p>
        )}

        {checkItems.length > 0 && (
          <div>
            <hr className="border-gold/20 mb-4" />
            <p className="text-[9px] font-bold tracking-[2.5px] text-gold uppercase mb-4">
              구매 전 확인사항
            </p>
            <ul className="flex flex-col gap-2.5">
              {checkItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 border border-gold/60 rounded flex-shrink-0 mt-0.5 flex items-center justify-center text-[10px] text-gold font-bold">
                    ✓
                  </span>
                  <span className="text-sm text-brown-dark leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {product?.idus_url && (
          <div className="mt-8 pt-5 border-t border-gold/20 text-center">
            <a
              href={product.idus_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gold underline underline-offset-2"
            >
              아이디어스에서 자세히 보기
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
```

---

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/components/ProductLandingPage.test.tsx
```

Expected: 7/7 PASS

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
git commit -m "feat: redesign ProductLandingPage — editorial layout, checklist, inline CTA"
```
