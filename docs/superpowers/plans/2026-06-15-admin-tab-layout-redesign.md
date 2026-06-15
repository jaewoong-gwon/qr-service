# Admin Tab Layout Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 새 QR 생성·수정 페이지를 탭 기반 레이아웃으로 통합하고, 미리보기 패널을 내부 스크롤로 전환한다.

**Architecture:** 두 페이지가 동일한 탭 구조(기본 정보 → 구매 안내 → 태그 → 섹션)를 공유한다. 공유 모달 컴포넌트(`SaveCompleteModal`)를 신규 생성하고, 각 페이지를 전면 재작성한다. 미리보기 패널은 `overflow-y: auto`로 변경해 섹션이 많아도 내부 스크롤로 확인 가능하게 한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, Vitest + React Testing Library, Playwright E2E

---

## 파일 구조

| 파일 | 작업 |
|---|---|
| `__tests__/lib/drive.test.ts` | **삭제** (drive.ts 삭제됨) |
| `__tests__/lib/qr.test.ts` | **수정** (computeSlug → generateSlug) |
| `components/admin/SaveCompleteModal.tsx` | **신규** |
| `__tests__/components/admin/SaveCompleteModal.test.tsx` | **신규** |
| `app/admin/qr/new/page.tsx` | **전면 재작성** |
| `app/admin/qr/new/steps/Step2Tags.tsx` | **삭제** |
| `app/admin/qr/new/steps/Step3Sections.tsx` | **삭제** |
| `app/admin/qr/new/steps/Step4Notice.tsx` | **삭제** |
| `app/admin/qr/new/steps/Step5Confirm.tsx` | **삭제** |
| `app/admin/qr/[id]/edit/EditClient.tsx` | **전면 재작성** |
| `e2e/qr.spec.ts` | **수정** |

---

### Task 1: 현재 깨진 단위 테스트 수정

`lib/drive.ts`가 삭제되고 `computeSlug`가 `generateSlug`로 교체되면서 두 테스트 파일이 깨져 있다. 먼저 테스트를 정상화한다.

**Files:**
- Delete: `__tests__/lib/drive.test.ts`
- Modify: `__tests__/lib/qr.test.ts`

- [ ] **Step 1: 깨진 테스트 확인**

```bash
npx vitest run 2>&1 | grep -E "FAIL|failed"
```

Expected: `__tests__/lib/drive.test.ts` and `__tests__/lib/qr.test.ts` failing.

- [ ] **Step 2: drive.test.ts 삭제**

```bash
rm __tests__/lib/drive.test.ts
```

- [ ] **Step 3: qr.test.ts를 generateSlug 테스트로 교체**

`__tests__/lib/qr.test.ts` 전체를 아래로 교체:

```ts
import { describe, it, expect } from 'vitest'
import { generateSlug } from '@/lib/qr'

describe('generateSlug', () => {
  it('8자리 소문자 hex 문자열을 반환한다', () => {
    const slug = generateSlug()
    expect(slug).toHaveLength(8)
    expect(slug).toMatch(/^[0-9a-f]{8}$/)
  })

  it('호출할 때마다 다른 slug를 반환한다', () => {
    const slugs = new Set(Array.from({ length: 20 }, generateSlug))
    expect(slugs.size).toBeGreaterThan(15)
  })
})
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 모든 테스트 통과. `__tests__/lib/drive.test.ts` 더 이상 없음.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "test: replace computeSlug tests with generateSlug, delete drive.test.ts"
```

---

### Task 2: SaveCompleteModal 컴포넌트

저장/생성 완료 후 표시되는 공유 모달. 두 페이지에서 재사용.

**Files:**
- Create: `components/admin/SaveCompleteModal.tsx`
- Create: `__tests__/components/admin/SaveCompleteModal.test.tsx`

- [ ] **Step 1: 테스트 먼저 작성**

`__tests__/components/admin/SaveCompleteModal.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SaveCompleteModal } from '@/components/admin/SaveCompleteModal'

const defaultProps = {
  open: true,
  title: '저장되었습니다 ✓',
  message: '변경사항이 저장되었습니다',
  primaryLabel: '계속 수정하기',
  onPrimary: vi.fn(),
  secondaryLabel: '홈으로',
  onSecondary: vi.fn(),
}

describe('SaveCompleteModal', () => {
  it('open=true 이면 모달이 표시된다', () => {
    render(<SaveCompleteModal {...defaultProps} />)
    expect(screen.getByText('저장되었습니다 ✓')).toBeInTheDocument()
    expect(screen.getByText('변경사항이 저장되었습니다')).toBeInTheDocument()
  })

  it('open=false 이면 렌더링되지 않는다', () => {
    render(<SaveCompleteModal {...defaultProps} open={false} />)
    expect(screen.queryByText('저장되었습니다 ✓')).not.toBeInTheDocument()
  })

  it('primary 버튼 클릭 시 onPrimary가 호출된다', () => {
    const onPrimary = vi.fn()
    render(<SaveCompleteModal {...defaultProps} onPrimary={onPrimary} />)
    fireEvent.click(screen.getByRole('button', { name: '계속 수정하기' }))
    expect(onPrimary).toHaveBeenCalledTimes(1)
  })

  it('secondary 버튼 클릭 시 onSecondary가 호출된다', () => {
    const onSecondary = vi.fn()
    render(<SaveCompleteModal {...defaultProps} onSecondary={onSecondary} />)
    fireEvent.click(screen.getByRole('button', { name: '홈으로' }))
    expect(onSecondary).toHaveBeenCalledTimes(1)
  })

  it('버튼 레이블이 props에 따라 렌더링된다', () => {
    render(<SaveCompleteModal {...defaultProps} primaryLabel="수정 계속하기" secondaryLabel="대시보드로" />)
    expect(screen.getByRole('button', { name: '수정 계속하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '대시보드로' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run __tests__/components/admin/SaveCompleteModal.test.tsx
```

Expected: FAIL — `SaveCompleteModal` not found.

- [ ] **Step 3: SaveCompleteModal 구현**

`components/admin/SaveCompleteModal.tsx`:

```tsx
'use client'

interface SaveCompleteModalProps {
  open: boolean
  title: string
  message: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel: string
  onSecondary: () => void
}

export function SaveCompleteModal({
  open,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: SaveCompleteModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown-dark/40 backdrop-blur-sm">
      <div className="bg-cream rounded-2xl px-8 py-8 shadow-2xl border border-gold/30 text-center w-80">
        <h2 className="text-lg font-bold text-brown-dark mb-2">{title}</h2>
        <p className="text-sm text-brown-mid mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onSecondary}
            className="text-sm text-brown-light border border-gold/40 rounded-lg px-4 py-2 hover:bg-gold/10 transition-colors"
          >
            {secondaryLabel}
          </button>
          <button
            onClick={onPrimary}
            className="text-sm bg-gold text-cream font-bold px-5 py-2 rounded-lg hover:bg-gold/90 transition-colors"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/components/admin/SaveCompleteModal.test.tsx
```

Expected: 5/5 PASS.

- [ ] **Step 5: 전체 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 모두 통과.

- [ ] **Step 6: 커밋**

```bash
git add components/admin/SaveCompleteModal.tsx __tests__/components/admin/SaveCompleteModal.test.tsx
git commit -m "feat: add SaveCompleteModal shared component"
```

---

### Task 3: 새 QR 생성 페이지 전면 재작성

위저드 5단계 → 탭 4개로 전환. `Step2-5` 파일 삭제. 미리보기 스크롤 픽스 포함.

**Files:**
- Modify: `app/admin/qr/new/page.tsx`
- Delete: `app/admin/qr/new/steps/Step2Tags.tsx`
- Delete: `app/admin/qr/new/steps/Step3Sections.tsx`
- Delete: `app/admin/qr/new/steps/Step4Notice.tsx`
- Delete: `app/admin/qr/new/steps/Step5Confirm.tsx`

- [ ] **Step 1: 불필요한 step 파일 삭제**

```bash
rm app/admin/qr/new/steps/Step2Tags.tsx \
   app/admin/qr/new/steps/Step3Sections.tsx \
   app/admin/qr/new/steps/Step4Notice.tsx \
   app/admin/qr/new/steps/Step5Confirm.tsx
```

- [ ] **Step 2: page.tsx 전면 재작성**

`app/admin/qr/new/page.tsx` 전체를 아래로 교체:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import { Step1Basic, type BasicData } from './steps/Step1Basic'
import { TagsPanel } from '@/components/admin/TagsPanel'
import { SectionsPanel } from '@/components/admin/SectionsPanel'
import { NoticePanel } from '@/components/admin/NoticePanel'
import { SaveCompleteModal } from '@/components/admin/SaveCompleteModal'
import type { NoticeFormData } from '@/components/admin/NoticePanel'
import type { Product, ProductTag, ProductSection, NoticeGroup } from '@/lib/types'

const PREVIEW_SCALE = 0.923
const INNER_W = 390
const OUTER_W = Math.round(INNER_W * PREVIEW_SCALE)
const OUTER_H = Math.round(800 * PREVIEW_SCALE)

const TABS = ['기본 정보', '구매 안내', '태그', '섹션'] as const
type Tab = (typeof TABS)[number]

const INITIAL_BASIC: BasicData = { name: '', subtitle: '', summary: '', idusUrl: '' }

export default function NewQrPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('기본 정보')
  const [basic, setBasic] = useState<BasicData>(INITIAL_BASIC)
  const [tags, setTags] = useState<ProductTag[]>([])
  const [sections, setSections] = useState<ProductSection[]>([])
  const [noticeData, setNoticeData] = useState<NoticeFormData | null>(null)
  const [noticeGroups, setNoticeGroups] = useState<(NoticeGroup & { id: string; name: string })[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch('/api/notice-groups')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setNoticeGroups(data) })
  }, [])

  const canCreate = basic.name.trim() !== '' && basic.idusUrl.trim() !== ''

  const previewProduct: Product = {
    id: '',
    qr_code_id: '',
    name: basic.name.trim() || '(제품명)',
    subtitle: basic.subtitle.trim() || null,
    summary: basic.summary.trim() || null,
    idus_url: basic.idusUrl.trim() || null,
    is_active: true,
    product_tags: tags,
    product_sections: sections,
    notice_groups:
      noticeData?.mode === 'new' && noticeData.newGroup
        ? {
            notice_group_items: noticeData.newGroup.items.map((item, i) => ({
              content: item.content,
              sort_order: i,
            })),
          }
        : null,
  }

  async function handleCreate() {
    setLoading(true)
    setError('')
    const body = {
      name: basic.name.trim(),
      subtitle: basic.subtitle.trim() || null,
      summary: basic.summary.trim() || null,
      idus_url: basic.idusUrl.trim() || null,
      tags: tags.map((t, i) => ({ label: t.label, sort_order: i })),
      sections: sections.map((s, i) => ({
        section_type: s.section_type,
        title: s.title,
        body: s.body,
        sort_order: i,
        items: s.product_section_items.map((item, j) => ({
          title: item.title,
          description: item.description,
          sort_order: j,
        })),
      })),
      notice: noticeData
        ? {
            group_id: noticeData.mode === 'existing' ? noticeData.groupId : null,
            new_group: noticeData.mode === 'new' ? noticeData.newGroup : null,
          }
        : null,
    }
    const res = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      setCreatedId(data.id)
      setShowModal(true)
    } else {
      const data = await res.json()
      setError(data.error ?? '생성에 실패했습니다.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream-bg">
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
              <h1 className="text-base font-bold text-brown-dark">새 QR 코드 생성</h1>
              <span className="text-[9px] tracking-[3px] text-gold">NEW QR CODE</span>
            </div>
          </div>
          {/* 탭 인디케이터 */}
          <div className="flex items-center gap-1.5">
            {TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  tab === t
                    ? 'bg-gold text-cream font-bold'
                    : 'text-brown-light border border-gold/30 hover:bg-gold/10'
                }`}
              >
                {i + 1}. {t}
              </button>
            ))}
          </div>
          {/* QR 생성 버튼 */}
          <div className="flex flex-col items-end gap-1">
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={!canCreate || loading}
              className="text-sm bg-gold text-cream font-bold px-5 py-2 rounded-lg hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '생성 중...' : 'QR 생성'}
            </button>
            {!canCreate && (
              <p className="text-[10px] text-brown-muted">제품명·아이디어스 링크 입력 후 활성화</p>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-8 py-8">
        <div className="flex gap-8 items-start">
          {/* 탭 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">{tab}</p>
              {tab === '기본 정보' && <Step1Basic data={basic} onChange={setBasic} />}
              {tab === '구매 안내' && (
                <div>
                  <p className="text-xs text-brown-muted mb-4">
                    구매 전 확인사항을 그룹으로 관리합니다. 여러 제품이 같은 그룹을 공유할 수 있습니다.
                  </p>
                  <NoticePanel
                    mode="create"
                    noticeData={noticeData}
                    groups={noticeGroups}
                    onChange={setNoticeData}
                  />
                </div>
              )}
              {tab === '태그' && (
                <div>
                  <p className="text-xs text-brown-muted mb-4">
                    태그는 hero 영역에 pill 형태로 표시됩니다. 예: #레진 #한국전통 #키링
                  </p>
                  <TagsPanel mode="create" tags={tags} onChange={setTags} />
                </div>
              )}
              {tab === '섹션' && (
                <div>
                  <p className="text-xs text-brown-muted mb-4">
                    섹션은 랜딩 페이지 본문에 순서대로 표시됩니다.
                  </p>
                  <SectionsPanel mode="create" sections={sections} onChange={setSections} />
                </div>
              )}
            </div>
          </div>

          {/* 실시간 미리보기 (내부 스크롤) */}
          <div className="w-[400px] flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
                실시간 미리보기
              </p>
              <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
                <div
                  className="overflow-y-auto overflow-x-hidden rounded-[36px] border-4 border-brown-dark/30 shadow-2xl bg-cream-bg"
                  style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px` }}
                >
                  <div
                    style={{
                      width: `${INNER_W}px`,
                      transform: `scale(${PREVIEW_SCALE})`,
                      transformOrigin: 'top left',
                      pointerEvents: 'none',
                    }}
                  >
                    <ProductLandingPage product={previewProduct} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SaveCompleteModal
        open={showModal}
        title="생성되었습니다 ✓"
        message="QR 코드가 생성되었습니다"
        primaryLabel="수정 계속하기"
        onPrimary={() => { if (createdId) router.push(`/admin/qr/${createdId}/edit`) }}
        secondaryLabel="홈으로"
        onSecondary={() => router.push('/admin/dashboard')}
      />
    </div>
  )
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npx next build 2>&1 | tail -20
```

Expected: 에러 없이 빌드 성공.

- [ ] **Step 4: 단위 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 모두 통과.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: rewrite new QR page to tab layout with scrollable preview"
```

---

### Task 4: 수정 페이지(EditClient) 전면 재작성

전체 노출 → 탭 방식 전환. 미리보기 스크롤 픽스 포함.

**Files:**
- Modify: `app/admin/qr/[id]/edit/EditClient.tsx`

- [ ] **Step 1: EditClient.tsx 전면 재작성**

`app/admin/qr/[id]/edit/EditClient.tsx` 전체를 아래로 교체:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import { TagsPanel } from '@/components/admin/TagsPanel'
import { SectionsPanel } from '@/components/admin/SectionsPanel'
import { NoticePanel } from '@/components/admin/NoticePanel'
import { SaveCompleteModal } from '@/components/admin/SaveCompleteModal'
import type { QrCodeWithProduct, Product, ProductTag, ProductSection, NoticeGroup } from '@/lib/types'

interface EditClientProps {
  item: QrCodeWithProduct
  allNoticeGroups: (NoticeGroup & { id: string; name: string })[]
}

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'
const hintClass = 'text-[11px] text-brown-muted font-normal'

const PREVIEW_SCALE = 0.923
const INNER_W = 390
const OUTER_W = Math.round(INNER_W * PREVIEW_SCALE)
const OUTER_H = Math.round(800 * PREVIEW_SCALE)

const TABS = ['기본 정보', '구매 안내', '태그', '섹션'] as const
type Tab = (typeof TABS)[number]

export function EditClient({ item, allNoticeGroups }: EditClientProps) {
  const router = useRouter()
  const p = item.products
  const [tab, setTab] = useState<Tab>('기본 정보')

  const [name, setName] = useState(p?.name ?? '')
  const [subtitle, setSubtitle] = useState(p?.subtitle ?? '')
  const [summary, setSummary] = useState(p?.summary ?? '')
  const [idusUrl, setIdusUrl] = useState(p?.idus_url ?? '')

  const [tags, setTags] = useState<(ProductTag & { id: string })[]>(
    (p?.product_tags ?? []) as (ProductTag & { id: string })[]
  )
  const [sections, setSections] = useState<ProductSection[]>(p?.product_sections ?? [])
  const [noticeGroupId, setNoticeGroupId] = useState<string | null>(p?.notice_group_id ?? null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showModal, setShowModal] = useState(false)

  const previewProduct: Product = {
    id: p?.id ?? '',
    qr_code_id: item.id,
    name: name.trim() || '(제품명)',
    subtitle: subtitle.trim() || null,
    summary: summary.trim() || null,
    idus_url: idusUrl.trim() || null,
    is_active: p?.is_active ?? true,
    product_tags: tags,
    notice_groups: allNoticeGroups.find((g) => g.id === noticeGroupId) ?? p?.notice_groups ?? null,
    product_sections: sections,
  }

  async function handleSave() {
    if (tab === '기본 정보') {
      setSaving(true)
      setSaveError('')
      const res = await fetch(`/api/qr/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          subtitle: subtitle.trim() || null,
          summary: summary.trim() || null,
          idus_url: idusUrl.trim() || null,
        }),
      })
      setSaving(false)
      if (!res.ok) {
        const data = await res.json()
        setSaveError(data.error ?? '저장에 실패했습니다.')
        return
      }
    }
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-cream-bg">
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
          {/* 탭 인디케이터 */}
          <div className="flex items-center gap-1.5">
            {TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  tab === t
                    ? 'bg-gold text-cream font-bold'
                    : 'text-brown-light border border-gold/30 hover:bg-gold/10'
                }`}
              >
                {i + 1}. {t}
              </button>
            ))}
          </div>
          <Link
            href={`/r/${item.slug}`}
            target="_blank"
            className="text-sm text-brown-light border border-gold/40 rounded-lg px-4 py-2 hover:bg-gold/10 transition-colors"
          >
            페이지 보기 →
          </Link>
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-8 py-8">
        <div className="flex gap-8 items-start">
          {/* 탭 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">{tab}</p>

              {tab === '기본 정보' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelClass}>
                      제품명 <span className="text-gold">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="레진 갓 키링"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      한 줄 카피 <span className={hintClass}>(상단에 표시)</span>
                    </label>
                    <input
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="전통의 아름다움을 일상 속에"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      요약 <span className={hintClass}>(hero 영역 하단 짧은 문단)</span>
                    </label>
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={2}
                      placeholder="제품에 대한 짧은 요약 문장"
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>아이디어스 구매 링크</label>
                    <input
                      type="url"
                      value={idusUrl}
                      onChange={(e) => setIdusUrl(e.target.value)}
                      placeholder="https://www.idus.com/v2/product/..."
                      className={inputClass}
                    />
                    <p className={`mt-1.5 ${hintClass}`}>없으면 CTA 버튼이 노출되지 않습니다.</p>
                  </div>
                </div>
              )}

              {tab === '구매 안내' && (
                <div>
                  <p className="text-xs text-brown-muted mb-3">
                    공유 그룹 항목 수정 시 해당 그룹을 사용하는 모든 제품에 반영됩니다.
                  </p>
                  <NoticePanel
                    mode="edit"
                    currentGroupId={noticeGroupId}
                    groups={allNoticeGroups}
                    qrId={item.id}
                    onUpdate={setNoticeGroupId}
                  />
                </div>
              )}

              {tab === '태그' && (
                <TagsPanel
                  mode="edit"
                  tags={tags}
                  qrId={item.id}
                  onUpdate={setTags}
                />
              )}

              {tab === '섹션' && (
                <SectionsPanel
                  mode="edit"
                  sections={sections}
                  qrId={item.id}
                  onUpdate={setSections}
                />
              )}

              {/* 저장 버튼 (모든 탭) */}
              <div className="mt-6 pt-4 border-t border-gold/20 flex items-center justify-end gap-3">
                {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm bg-gold text-cream font-bold px-5 py-2 rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>

          {/* 실시간 미리보기 (내부 스크롤) */}
          <div className="w-[400px] flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
                실시간 미리보기
              </p>
              <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
                <div
                  className="overflow-y-auto overflow-x-hidden rounded-[36px] border-4 border-brown-dark/30 shadow-2xl bg-cream-bg"
                  style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px` }}
                >
                  <div
                    style={{
                      width: `${INNER_W}px`,
                      transform: `scale(${PREVIEW_SCALE})`,
                      transformOrigin: 'top left',
                      pointerEvents: 'none',
                    }}
                  >
                    <ProductLandingPage product={previewProduct} />
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

      <SaveCompleteModal
        open={showModal}
        title="저장되었습니다 ✓"
        message="변경사항이 저장되었습니다"
        primaryLabel="계속 수정하기"
        onPrimary={() => setShowModal(false)}
        secondaryLabel="홈으로"
        onSecondary={() => router.push('/admin/dashboard')}
      />
    </div>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npx next build 2>&1 | tail -20
```

Expected: 에러 없이 빌드 성공.

- [ ] **Step 3: 단위 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 모두 통과.

- [ ] **Step 4: 커밋**

```bash
git add app/admin/qr/\\[id\\]/edit/EditClient.tsx
git commit -m "feat: rewrite edit page to tab layout with scrollable preview and save modal"
```

---

### Task 5: E2E 테스트 업데이트

새 플로우에 맞게 E2E 테스트를 재작성한다. 위저드 `다음 →` 제거, 모달 클릭 추가, 활성화 조건 테스트 추가.

**Files:**
- Modify: `e2e/qr.spec.ts`

- [ ] **Step 1: e2e/qr.spec.ts 전체 교체**

```ts
// e2e/qr.spec.ts
// Auth cookie is injected via globalSetup (JWT_SECRET) — no login credentials needed.
import { test, expect } from '@playwright/test'

const TEST_PRODUCT_NAME = 'E2E Test Product'
const TEST_IDUS_URL = 'https://www.idus.com/v2/product/e2e-test-id'

test('can access /admin/qr/new when authenticated', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByRole('heading', { name: '새 QR 코드 생성' })).toBeVisible()
})

test('QR creation form has correct fields on tab 1', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByLabel('제품명')).toBeVisible()
  await expect(page.getByLabel('한 줄 카피', { exact: false })).toBeVisible()
  await expect(page.getByLabel('아이디어스 구매 링크', { exact: false })).toBeVisible()
})

test('QR 생성 button is disabled without required fields', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByRole('button', { name: 'QR 생성' })).toBeDisabled()
})

test('QR 생성 button activates after filling 제품명 and 아이디어스 링크', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('아이디어스 구매 링크', { exact: false }).fill(TEST_IDUS_URL)
  await expect(page.getByRole('button', { name: 'QR 생성' })).toBeEnabled()
})

test('creating QR shows modal and 홈으로 redirects to dashboard', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('아이디어스 구매 링크', { exact: false }).fill(
    `https://www.idus.com/v2/product/e2e-${Date.now()}`
  )
  await page.getByRole('button', { name: 'QR 생성' }).click()
  await expect(page.getByText('생성되었습니다')).toBeVisible()
  await page.getByRole('button', { name: '홈으로' }).click()
  await expect(page).toHaveURL('/admin/dashboard')
})

test('/r/{slug} shows product name', async ({ page }) => {
  const createRes = await page.request.post('/api/qr', {
    data: { name: TEST_PRODUCT_NAME },
  })
  const { id, slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()
  await expect(page.getByRole('link', { name: /아이디어스 작품 페이지 보기/ })).toHaveCount(0)

  if (id) await page.request.delete(`/api/qr/${id}`)
})

test('/r/{slug} shows idus purchase button when idus_url is provided', async ({ page }) => {
  const createRes = await page.request.post('/api/qr', {
    data: { name: TEST_PRODUCT_NAME, idus_url: TEST_IDUS_URL },
  })
  const { id, slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()
  const link = page.getByRole('link', { name: /아이디어스 작품 페이지 보기/ })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', TEST_IDUS_URL)

  if (id) await page.request.delete(`/api/qr/${id}`)
})
```

- [ ] **Step 2: 빌드 + 단위 테스트 최종 확인**

```bash
npx next build 2>&1 | tail -5 && npx vitest run
```

Expected: 빌드 성공 + 모든 단위 테스트 통과.

- [ ] **Step 3: 커밋 및 푸시**

```bash
git add e2e/qr.spec.ts
git commit -m "test(e2e): update for tab layout - add modal flow, activation condition tests"
git push
```
