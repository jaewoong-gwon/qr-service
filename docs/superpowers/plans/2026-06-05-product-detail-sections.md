# Product Detail Sections Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a section-based product detail page where each product has an ordered list of typed sections fetched from Supabase, rendered with a fixed cream/gold design.

**Architecture:** New `product_sections` Supabase table stores typed JSONB sections per product. `app/r/[slug]/page.tsx` fetches sections and renders either the new `ProductDetailView` (if sections exist) or falls back to the existing `ProductPageView`. Seven section-type components live under `components/product-detail/sections/`.

**Tech Stack:** Next.js 16 App Router (server components), Supabase, Tailwind v4 (`@theme inline` tokens), TypeScript, Vitest + @testing-library/react

**Spec:** `docs/superpowers/specs/2026-06-05-product-detail-sections.md`

---

## File Structure

**Create:**
- `components/product-detail/ProductDetailView.tsx` — orchestrator, maps section_type → component
- `components/product-detail/sections/HeroSection.tsx`
- `components/product-detail/sections/TextBlockSection.tsx`
- `components/product-detail/sections/FeatureCardsSection.tsx`
- `components/product-detail/sections/SpecsSection.tsx`
- `components/product-detail/sections/RecommendListSection.tsx`
- `components/product-detail/sections/QuoteSection.tsx`
- `components/product-detail/sections/PhotoSection.tsx` (`'use client'` — lightbox)
- `__tests__/components/product-detail/HeroSection.test.tsx`
- `__tests__/components/product-detail/TextBlockSection.test.tsx`
- `__tests__/components/product-detail/FeatureCardsSection.test.tsx`
- `__tests__/components/product-detail/SpecsSection.test.tsx`
- `__tests__/components/product-detail/RecommendListSection.test.tsx`
- `__tests__/components/product-detail/QuoteSection.test.tsx`
- `__tests__/components/product-detail/PhotoSection.test.tsx`
- `__tests__/components/product-detail/ProductDetailView.test.tsx`

**Modify:**
- `lib/types.ts` — add ProductSection types
- `app/r/[slug]/page.tsx` — fetch sections, conditional render

---

### Task 1: Add ProductSection types to lib/types.ts

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add types to lib/types.ts**

Open `lib/types.ts` and append the following after the existing exports:

```ts
export type SectionType =
  | 'hero'
  | 'text_block'
  | 'feature_cards'
  | 'specs'
  | 'recommend_list'
  | 'quote'
  | 'photo_section'

export interface HeroContent {
  title: string
  subtitle: string
  body?: string
  image_drive_id?: string
}

export interface TextBlockContent {
  heading: string
  subheading?: string
  body: string
  icon_drive_id?: string
}

export interface FeatureCard {
  icon_drive_id: string
  title: string
  description: string
}

export interface FeatureCardsContent {
  heading: string
  cards: FeatureCard[]
}

export interface SpecsItem {
  image_drive_id: string
  label: string
}

export interface SpecsContent {
  heading: string
  items: SpecsItem[]
  note?: string
}

export interface RecommendListContent {
  heading: string
  items: string[]
}

export interface QuoteContent {
  text: string
  attribution?: string
}

export interface PhotoSectionContent {
  heading?: string
  body?: string
  image_drive_id: string
}

export type SectionContent =
  | HeroContent
  | TextBlockContent
  | FeatureCardsContent
  | SpecsContent
  | RecommendListContent
  | QuoteContent
  | PhotoSectionContent

export interface ProductSection {
  id: string
  product_id: string
  section_type: SectionType
  display_order: number
  content: SectionContent
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add ProductSection types to lib/types.ts"
```

---

### Task 2: HeroSection component + test

**Files:**
- Create: `components/product-detail/sections/HeroSection.tsx`
- Create: `__tests__/components/product-detail/HeroSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/product-detail/HeroSection.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroSection } from '@/components/product-detail/sections/HeroSection'
import type { HeroContent } from '@/lib/types'

const content: HeroContent = {
  title: '전통의 의미를 담은 명태',
  subtitle: '액막이 손뜨개',
}

describe('HeroSection', () => {
  it('renders title and subtitle', () => {
    render(<HeroSection content={content} />)
    expect(screen.getByText('전통의 의미를 담은 명태')).toBeInTheDocument()
    expect(screen.getByText('액막이 손뜨개')).toBeInTheDocument()
  })

  it('renders body text when provided', () => {
    render(<HeroSection content={{ ...content, body: '본문 텍스트' }} />)
    expect(screen.getByText('본문 텍스트')).toBeInTheDocument()
  })

  it('renders image when image_drive_id provided', () => {
    render(<HeroSection content={{ ...content, image_drive_id: 'abc123' }} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', expect.stringContaining('abc123'))
  })

  it('renders without optional fields', () => {
    render(<HeroSection content={content} />)
    expect(screen.queryByRole('img')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/product-detail/HeroSection.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/product-detail/sections/HeroSection'`

- [ ] **Step 3: Implement HeroSection**

Create `components/product-detail/sections/HeroSection.tsx`:

```tsx
import { driveThumbUrl } from '@/lib/drive'
import type { HeroContent } from '@/lib/types'

export function HeroSection({ content }: { content: HeroContent }) {
  return (
    <section className="py-8">
      <div className="max-w-[480px] mx-auto px-4">
        {content.image_drive_id && (
          <img
            src={driveThumbUrl(content.image_drive_id, 800)}
            alt={content.title}
            className="w-full rounded-xl border border-gold/20 mb-6"
          />
        )}
        <p className="text-[10px] tracking-[3px] text-gold uppercase mb-2">
          {content.subtitle}
        </p>
        <h1 className="text-3xl font-bold text-brown-dark leading-tight">
          {content.title}
        </h1>
        {content.body && (
          <p className="text-sm text-brown-mid leading-relaxed mt-3">
            {content.body}
          </p>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/product-detail/HeroSection.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/product-detail/sections/HeroSection.tsx __tests__/components/product-detail/HeroSection.test.tsx
git commit -m "feat: add HeroSection component"
```

---

### Task 3: TextBlockSection component + test

**Files:**
- Create: `components/product-detail/sections/TextBlockSection.tsx`
- Create: `__tests__/components/product-detail/TextBlockSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/product-detail/TextBlockSection.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TextBlockSection } from '@/components/product-detail/sections/TextBlockSection'
import type { TextBlockContent } from '@/lib/types'

const content: TextBlockContent = {
  heading: '왜 명태를 걸어둘까요?',
  body: '명태는 예로부터 큰 생선으로...',
}

describe('TextBlockSection', () => {
  it('renders heading and body', () => {
    render(<TextBlockSection content={content} />)
    expect(screen.getByText('왜 명태를 걸어둘까요?')).toBeInTheDocument()
    expect(screen.getByText('명태는 예로부터 큰 생선으로...')).toBeInTheDocument()
  })

  it('renders subheading when provided', () => {
    render(<TextBlockSection content={{ ...content, subheading: '명태와 장수의 의미' }} />)
    expect(screen.getByText('명태와 장수의 의미')).toBeInTheDocument()
  })

  it('renders icon image when icon_drive_id provided', () => {
    render(<TextBlockSection content={{ ...content, icon_drive_id: 'icon123' }} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('icon123'))
  })

  it('renders without optional fields', () => {
    render(<TextBlockSection content={content} />)
    expect(screen.queryByRole('img')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/product-detail/TextBlockSection.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement TextBlockSection**

Create `components/product-detail/sections/TextBlockSection.tsx`:

```tsx
import { driveThumbUrl } from '@/lib/drive'
import type { TextBlockContent } from '@/lib/types'

export function TextBlockSection({ content }: { content: TextBlockContent }) {
  return (
    <section className="py-8 border-t border-gold/20">
      <div className="max-w-[480px] mx-auto px-4 text-center">
        {content.icon_drive_id && (
          <img
            src={driveThumbUrl(content.icon_drive_id, 64)}
            alt=""
            className="w-8 h-8 object-contain mx-auto mb-3"
          />
        )}
        {content.subheading && (
          <p className="text-[10px] tracking-[3px] text-gold uppercase mb-2">
            {content.subheading}
          </p>
        )}
        <h2 className="text-2xl font-bold text-brown-dark">{content.heading}</h2>
        <div className="w-8 h-px bg-gold mx-auto my-3" />
        <p className="text-sm text-brown-mid leading-relaxed">{content.body}</p>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/product-detail/TextBlockSection.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/product-detail/sections/TextBlockSection.tsx __tests__/components/product-detail/TextBlockSection.test.tsx
git commit -m "feat: add TextBlockSection component"
```

---

### Task 4: FeatureCardsSection component + test

**Files:**
- Create: `components/product-detail/sections/FeatureCardsSection.tsx`
- Create: `__tests__/components/product-detail/FeatureCardsSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/product-detail/FeatureCardsSection.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeatureCardsSection } from '@/components/product-detail/sections/FeatureCardsSection'
import type { FeatureCardsContent } from '@/lib/types'

const content: FeatureCardsContent = {
  heading: '부담 없이 선택되는 이유',
  cards: [
    { icon_drive_id: 'icon1', title: '국내 손뜨개 제작', description: '수제업 제작' },
    { icon_drive_id: 'icon2', title: '가벼운 무게', description: '부담없는 크기' },
  ],
}

describe('FeatureCardsSection', () => {
  it('renders heading', () => {
    render(<FeatureCardsSection content={content} />)
    expect(screen.getByText('부담 없이 선택되는 이유')).toBeInTheDocument()
  })

  it('renders all card titles and descriptions', () => {
    render(<FeatureCardsSection content={content} />)
    expect(screen.getByText('국내 손뜨개 제작')).toBeInTheDocument()
    expect(screen.getByText('수제업 제작')).toBeInTheDocument()
    expect(screen.getByText('가벼운 무게')).toBeInTheDocument()
    expect(screen.getByText('부담없는 크기')).toBeInTheDocument()
  })

  it('renders card icon images', () => {
    render(<FeatureCardsSection content={content} />)
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(2)
    expect(imgs[0]).toHaveAttribute('src', expect.stringContaining('icon1'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/product-detail/FeatureCardsSection.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement FeatureCardsSection**

Create `components/product-detail/sections/FeatureCardsSection.tsx`:

```tsx
import { driveThumbUrl } from '@/lib/drive'
import type { FeatureCardsContent } from '@/lib/types'

export function FeatureCardsSection({ content }: { content: FeatureCardsContent }) {
  if (content.cards.length === 0) return null

  return (
    <section className="py-8 border-t border-gold/20">
      <div className="max-w-[480px] mx-auto px-4">
        <h2 className="text-xl font-bold text-brown-dark text-center mb-4">
          {content.heading}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {content.cards.map((card, i) => (
            <div
              key={i}
              className="bg-cream border border-gold/30 rounded-xl p-4 flex flex-col items-center gap-2"
            >
              <img
                src={driveThumbUrl(card.icon_drive_id, 80)}
                alt={card.title}
                className="w-10 h-10 object-contain"
              />
              <p className="text-sm font-bold text-brown-dark text-center">{card.title}</p>
              <p className="text-xs text-brown-light text-center">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/product-detail/FeatureCardsSection.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/product-detail/sections/FeatureCardsSection.tsx __tests__/components/product-detail/FeatureCardsSection.test.tsx
git commit -m "feat: add FeatureCardsSection component"
```

---

### Task 5: SpecsSection component + test

**Files:**
- Create: `components/product-detail/sections/SpecsSection.tsx`
- Create: `__tests__/components/product-detail/SpecsSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/product-detail/SpecsSection.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpecsSection } from '@/components/product-detail/sections/SpecsSection'
import type { SpecsContent } from '@/lib/types'

const content: SpecsContent = {
  heading: '구매 전 꼭 확인해주세요!',
  items: [
    { image_drive_id: 'img1', label: '13cm 내외' },
  ],
}

describe('SpecsSection', () => {
  it('renders heading', () => {
    render(<SpecsSection content={content} />)
    expect(screen.getByText('구매 전 꼭 확인해주세요!')).toBeInTheDocument()
  })

  it('renders item label and image', () => {
    render(<SpecsSection content={content} />)
    expect(screen.getByText('13cm 내외')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('img1'))
  })

  it('renders note when provided', () => {
    render(<SpecsSection content={{ ...content, note: '약간의 차이가 있을 수 있습니다.' }} />)
    expect(screen.getByText('약간의 차이가 있을 수 있습니다.')).toBeInTheDocument()
  })

  it('renders without note', () => {
    render(<SpecsSection content={content} />)
    expect(screen.queryByText('약간의 차이가 있을 수 있습니다.')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/product-detail/SpecsSection.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement SpecsSection**

Create `components/product-detail/sections/SpecsSection.tsx`:

```tsx
import { driveThumbUrl } from '@/lib/drive'
import type { SpecsContent } from '@/lib/types'

export function SpecsSection({ content }: { content: SpecsContent }) {
  return (
    <section className="py-8 border-t border-gold/20">
      <div className="max-w-[480px] mx-auto px-4">
        <h2 className="text-xl font-bold text-brown-dark text-center mb-4">
          {content.heading}
        </h2>
        <div className="flex flex-col gap-4">
          {content.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <img
                src={driveThumbUrl(item.image_drive_id, 200)}
                alt={item.label}
                className="w-24 h-24 object-cover rounded-lg border border-gold/20 flex-shrink-0"
              />
              <p className="text-sm font-bold text-brown-dark">{item.label}</p>
            </div>
          ))}
        </div>
        {content.note && (
          <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 text-xs text-brown-mid mt-4">
            {content.note}
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/product-detail/SpecsSection.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/product-detail/sections/SpecsSection.tsx __tests__/components/product-detail/SpecsSection.test.tsx
git commit -m "feat: add SpecsSection component"
```

---

### Task 6: RecommendListSection component + test

**Files:**
- Create: `components/product-detail/sections/RecommendListSection.tsx`
- Create: `__tests__/components/product-detail/RecommendListSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/product-detail/RecommendListSection.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecommendListSection } from '@/components/product-detail/sections/RecommendListSection'
import type { RecommendListContent } from '@/lib/types'

const content: RecommendListContent = {
  heading: '이런 분들께 추천합니다!',
  items: ['전통적인 의미가 담긴 소품을 좋아하는 분', '집들이 선물을 고민 중인 분'],
}

describe('RecommendListSection', () => {
  it('renders heading', () => {
    render(<RecommendListSection content={content} />)
    expect(screen.getByText('이런 분들께 추천합니다!')).toBeInTheDocument()
  })

  it('renders all items', () => {
    render(<RecommendListSection content={content} />)
    expect(screen.getByText('전통적인 의미가 담긴 소품을 좋아하는 분')).toBeInTheDocument()
    expect(screen.getByText('집들이 선물을 고민 중인 분')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/product-detail/RecommendListSection.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement RecommendListSection**

Create `components/product-detail/sections/RecommendListSection.tsx`:

```tsx
import type { RecommendListContent } from '@/lib/types'

export function RecommendListSection({ content }: { content: RecommendListContent }) {
  if (content.items.length === 0) return null

  return (
    <section className="py-8 border-t border-gold/20">
      <div className="max-w-[480px] mx-auto px-4">
        <h2 className="text-xl font-bold text-brown-dark">{content.heading}</h2>
        <div className="w-8 h-px bg-gold my-3" />
        <ul className="flex flex-col gap-2">
          {content.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-gold text-base leading-snug flex-shrink-0">›</span>
              <span className="text-sm text-brown-mid">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/product-detail/RecommendListSection.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/product-detail/sections/RecommendListSection.tsx __tests__/components/product-detail/RecommendListSection.test.tsx
git commit -m "feat: add RecommendListSection component"
```

---

### Task 7: QuoteSection component + test

**Files:**
- Create: `components/product-detail/sections/QuoteSection.tsx`
- Create: `__tests__/components/product-detail/QuoteSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/product-detail/QuoteSection.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuoteSection } from '@/components/product-detail/sections/QuoteSection'
import type { QuoteContent } from '@/lib/types'

describe('QuoteSection', () => {
  it('renders quote text', () => {
    render(<QuoteSection content={{ text: '잘 되길 바라는 마음' }} />)
    expect(screen.getByText('잘 되길 바라는 마음')).toBeInTheDocument()
  })

  it('renders attribution when provided', () => {
    render(<QuoteSection content={{ text: '마음을 전하는 선물', attribution: '작품 이야기' }} />)
    expect(screen.getByText('작품 이야기')).toBeInTheDocument()
  })

  it('renders without attribution', () => {
    render(<QuoteSection content={{ text: '잘 되길 바라는 마음' }} />)
    expect(screen.queryByText('작품 이야기')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/product-detail/QuoteSection.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement QuoteSection**

Create `components/product-detail/sections/QuoteSection.tsx`:

```tsx
import type { QuoteContent } from '@/lib/types'

export function QuoteSection({ content }: { content: QuoteContent }) {
  return (
    <section className="py-8 border-t border-b border-gold/30 bg-cream">
      <div className="max-w-[480px] mx-auto px-4 text-center">
        <span className="text-4xl text-gold/40 leading-none">"</span>
        <p className="text-base text-brown-mid leading-relaxed -mt-2">
          {content.text}
        </p>
        <span className="text-4xl text-gold/40 leading-none">"</span>
        {content.attribution && (
          <p className="text-xs text-brown-light mt-2">{content.attribution}</p>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/product-detail/QuoteSection.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/product-detail/sections/QuoteSection.tsx __tests__/components/product-detail/QuoteSection.test.tsx
git commit -m "feat: add QuoteSection component"
```

---

### Task 8: PhotoSection component + test

**Files:**
- Create: `components/product-detail/sections/PhotoSection.tsx`
- Create: `__tests__/components/product-detail/PhotoSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/product-detail/PhotoSection.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhotoSection } from '@/components/product-detail/sections/PhotoSection'
import type { PhotoSectionContent } from '@/lib/types'

describe('PhotoSection', () => {
  it('renders image', () => {
    render(<PhotoSection content={{ image_drive_id: 'photo1' }} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('photo1'))
  })

  it('renders heading when provided', () => {
    render(<PhotoSection content={{ image_drive_id: 'photo1', heading: '마음을 전하는 방식' }} />)
    expect(screen.getByText('마음을 전하는 방식')).toBeInTheDocument()
  })

  it('renders body when provided', () => {
    render(<PhotoSection content={{ image_drive_id: 'photo1', body: '설명 텍스트' }} />)
    expect(screen.getByText('설명 텍스트')).toBeInTheDocument()
  })

  it('renders without optional heading and body', () => {
    render(<PhotoSection content={{ image_drive_id: 'photo1' }} />)
    expect(screen.queryByRole('heading')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/product-detail/PhotoSection.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement PhotoSection**

Create `components/product-detail/sections/PhotoSection.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { driveThumbUrl } from '@/lib/drive'
import type { PhotoSectionContent } from '@/lib/types'

export function PhotoSection({ content }: { content: PhotoSectionContent }) {
  const [lightbox, setLightbox] = useState(false)

  return (
    <section className="py-8 border-t border-gold/20">
      <div className="max-w-[480px] mx-auto px-4">
        {content.heading && (
          <h2 className="text-xl font-bold text-brown-dark">{content.heading}</h2>
        )}
        {content.body && (
          <p className="text-sm text-brown-mid leading-relaxed mt-2">{content.body}</p>
        )}
        <button
          onClick={() => setLightbox(true)}
          className="w-full mt-4"
          aria-label="이미지 크게 보기"
        >
          <img
            src={driveThumbUrl(content.image_drive_id, 800)}
            alt={content.heading ?? ''}
            className="w-full rounded-xl border border-gold/20"
          />
        </button>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={driveThumbUrl(content.image_drive_id, 2000)}
            alt={content.heading ?? ''}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/product-detail/PhotoSection.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/product-detail/sections/PhotoSection.tsx __tests__/components/product-detail/PhotoSection.test.tsx
git commit -m "feat: add PhotoSection component"
```

---

### Task 9: ProductDetailView orchestrator + test

**Files:**
- Create: `components/product-detail/ProductDetailView.tsx`
- Create: `__tests__/components/product-detail/ProductDetailView.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/product-detail/ProductDetailView.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductDetailView } from '@/components/product-detail/ProductDetailView'
import type { ProductSection } from '@/lib/types'

vi.mock('@/components/product-detail/sections/HeroSection', () => ({
  HeroSection: ({ content }: { content: { title: string } }) => <div>{content.title}</div>,
}))
vi.mock('@/components/product-detail/sections/TextBlockSection', () => ({
  TextBlockSection: ({ content }: { content: { heading: string } }) => <div>{content.heading}</div>,
}))
vi.mock('@/components/product-detail/sections/FeatureCardsSection', () => ({
  FeatureCardsSection: () => <div>feature-cards</div>,
}))
vi.mock('@/components/product-detail/sections/SpecsSection', () => ({
  SpecsSection: () => <div>specs</div>,
}))
vi.mock('@/components/product-detail/sections/RecommendListSection', () => ({
  RecommendListSection: () => <div>recommend-list</div>,
}))
vi.mock('@/components/product-detail/sections/QuoteSection', () => ({
  QuoteSection: ({ content }: { content: { text: string } }) => <div>{content.text}</div>,
}))
vi.mock('@/components/product-detail/sections/PhotoSection', () => ({
  PhotoSection: () => <div>photo-section</div>,
}))

const heroSection: ProductSection = {
  id: '1',
  product_id: 'p1',
  section_type: 'hero',
  display_order: 1,
  content: { title: '명태 키링', subtitle: '전통 액막이' },
}

const quoteSection: ProductSection = {
  id: '2',
  product_id: 'p1',
  section_type: 'quote',
  display_order: 2,
  content: { text: '잘 되길 바라는 마음' },
}

describe('ProductDetailView', () => {
  it('renders hero section', () => {
    render(<ProductDetailView sections={[heroSection]} />)
    expect(screen.getByText('명태 키링')).toBeInTheDocument()
  })

  it('renders quote section', () => {
    render(<ProductDetailView sections={[quoteSection]} />)
    expect(screen.getByText('잘 되길 바라는 마음')).toBeInTheDocument()
  })

  it('renders multiple sections in order', () => {
    render(<ProductDetailView sections={[heroSection, quoteSection]} />)
    expect(screen.getByText('명태 키링')).toBeInTheDocument()
    expect(screen.getByText('잘 되길 바라는 마음')).toBeInTheDocument()
  })

  it('skips unknown section types silently', () => {
    const unknown = { ...heroSection, section_type: 'unknown_type' } as unknown as ProductSection
    render(<ProductDetailView sections={[unknown]} />)
    expect(screen.queryByText('명태 키링')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/product-detail/ProductDetailView.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ProductDetailView**

Create `components/product-detail/ProductDetailView.tsx`:

```tsx
import type { ProductSection } from '@/lib/types'
import { HeroSection } from './sections/HeroSection'
import { TextBlockSection } from './sections/TextBlockSection'
import { FeatureCardsSection } from './sections/FeatureCardsSection'
import { SpecsSection } from './sections/SpecsSection'
import { RecommendListSection } from './sections/RecommendListSection'
import { QuoteSection } from './sections/QuoteSection'
import { PhotoSection } from './sections/PhotoSection'

interface ProductDetailViewProps {
  sections: ProductSection[]
}

export function ProductDetailView({ sections }: ProductDetailViewProps) {
  return (
    <div className="min-h-screen bg-cream-bg">
      <header className="border-b border-gold/30 py-4 text-center">
        <span className="text-[11px] tracking-[4px] text-gold uppercase">작품 이야기</span>
      </header>
      <main>
        {sections.map((section) => {
          switch (section.section_type) {
            case 'hero':
              return <HeroSection key={section.id} content={section.content as any} />
            case 'text_block':
              return <TextBlockSection key={section.id} content={section.content as any} />
            case 'feature_cards':
              return <FeatureCardsSection key={section.id} content={section.content as any} />
            case 'specs':
              return <SpecsSection key={section.id} content={section.content as any} />
            case 'recommend_list':
              return <RecommendListSection key={section.id} content={section.content as any} />
            case 'quote':
              return <QuoteSection key={section.id} content={section.content as any} />
            case 'photo_section':
              return <PhotoSection key={section.id} content={section.content as any} />
            default:
              return null
          }
        })}
      </main>
      <footer className="text-center text-[9px] tracking-[2px] text-gold/60 py-6">
        © 작품 이야기
      </footer>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/product-detail/ProductDetailView.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 5: Run full suite to check for regressions**

```bash
npx vitest run
```

Expected: all previously passing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add components/product-detail/ProductDetailView.tsx __tests__/components/product-detail/ProductDetailView.test.tsx
git commit -m "feat: add ProductDetailView orchestrator"
```

---

### Task 10: Wire up app/r/[slug]/page.tsx

**Files:**
- Modify: `app/r/[slug]/page.tsx`

- [ ] **Step 1: Replace file content**

Replace the entire contents of `app/r/[slug]/page.tsx` with:

```tsx
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getFolderImages } from '@/lib/drive'
import { ProductPageView } from '@/components/ProductPageView'
import { ProductDetailView } from '@/components/product-detail/ProductDetailView'
import type { ProductSection } from '@/lib/types'

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

  const { data: sectionsData } = await supabase
    .from('product_sections')
    .select('*')
    .eq('product_id', product?.id ?? '')
    .order('display_order', { ascending: true })

  const sections = (sectionsData ?? []) as ProductSection[]

  if (sections.length > 0) {
    return <ProductDetailView sections={sections} />
  }

  const images = await getFolderImages(qrCode.drive_folder_url)
  return <ProductPageView product={product ?? null} images={images} />
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/r/[slug]/page.tsx
git commit -m "feat: wire ProductDetailView into /r/[slug] with fallback to ProductPageView"
```

---

### Task 11: Supabase migration

**Note:** This task requires access to the Supabase project dashboard. Run the SQL in the Supabase SQL editor.

- [ ] **Step 1: Run migration SQL in Supabase SQL editor**

```sql
CREATE TABLE product_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  section_type  text NOT NULL
                  CHECK (section_type IN (
                    'hero', 'text_block', 'feature_cards',
                    'specs', 'recommend_list', 'quote', 'photo_section'
                  )),
  display_order int NOT NULL,
  content       jsonb NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX ON product_sections (product_id, display_order);
```

- [ ] **Step 2: Verify table exists**

In Supabase Table Editor, confirm `product_sections` table appears with the correct columns.

- [ ] **Step 3: Insert a test row to verify content can be saved**

```sql
-- Replace 'YOUR_PRODUCT_ID' with an actual product id from your products table
INSERT INTO product_sections (product_id, section_type, display_order, content)
VALUES (
  'YOUR_PRODUCT_ID',
  'hero',
  1,
  '{"title": "테스트 제품", "subtitle": "테스트 부제"}'::jsonb
);
```

- [ ] **Step 4: Commit migration note**

```bash
git commit --allow-empty -m "feat: apply product_sections table migration in Supabase"
```