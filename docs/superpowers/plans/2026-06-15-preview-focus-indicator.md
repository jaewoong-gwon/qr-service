# Preview Focus Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 미리보기 패널 클릭 시 테두리를 gold로 강조하고 "↕ 스크롤" 뱃지를 표시해 포커스 상태를 사용자에게 시각적으로 알린다.

**Architecture:** 두 페이지 컴포넌트(`new/page.tsx`, `EditClient.tsx`)에 각각 `previewFocused` boolean state를 추가한다. 미리보기 div 클릭 시 state를 true로 설정하고, `<main>` 클릭 시 false로 되돌린다. 테두리 색과 뱃지 opacity를 조건부 className으로 제어한다.

**Tech Stack:** React 19 useState, Tailwind CSS v4 transition-colors/transition-opacity, Next.js App Router Client Component

---

## File Structure

| 파일 | 변경 내용 |
|---|---|
| `app/admin/qr/new/page.tsx` | `previewFocused` state 추가, `<main>` onClick, 뱃지 + 조건부 border 클래스 |
| `app/admin/qr/[id]/edit/EditClient.tsx` | 동일 |

---

### Task 1: new/page.tsx — preview focus indicator

**Files:**
- Modify: `app/admin/qr/new/page.tsx`

현재 preview 영역 (line 201–224):
```tsx
{/* 실시간 미리보기 (내부 스크롤) */}
<div className="w-[400px] flex-shrink-0">
  <div className="sticky top-24">
    <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
      실시간 미리보기
    </p>
    <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
      <div
        className="overflow-y-auto overflow-x-hidden rounded-[36px] border-4 border-brown-dark/30 shadow-2xl bg-cream-bg [&::-webkit-scrollbar]:hidden"
        style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px`, scrollbarWidth: 'none' }}
      >
        <div style={{ width: `${INNER_W}px`, zoom: PREVIEW_SCALE, pointerEvents: 'none' }}>
          <ProductLandingPage product={previewProduct} />
        </div>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 1: `previewFocused` state 추가**

`app/admin/qr/new/page.tsx` 의 `const [showModal, setShowModal] = useState(false)` 바로 다음 줄에 추가:

```tsx
const [previewFocused, setPreviewFocused] = useState(false)
```

- [ ] **Step 2: `<main>` 에 outside-click 핸들러 추가**

기존:
```tsx
<main className="max-w-screen-xl mx-auto px-8 py-8">
```

변경:
```tsx
<main className="max-w-screen-xl mx-auto px-8 py-8" onClick={() => setPreviewFocused(false)}>
```

- [ ] **Step 3: 미리보기 영역을 뱃지 + 조건부 border로 교체**

기존 preview 블록(line 201~224)을 아래로 교체:

```tsx
{/* 실시간 미리보기 (내부 스크롤) */}
<div className="w-[400px] flex-shrink-0">
  <div className="sticky top-24">
    <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
      실시간 미리보기
    </p>
    {/* 포커스 뱃지 — h-6 공간 항상 예약, opacity로 fade */}
    <div className="flex justify-center mb-2 h-6">
      <span
        className={`text-[10px] bg-gold text-cream px-3 py-1 rounded-full font-bold transition-opacity ${
          previewFocused ? 'opacity-100' : 'opacity-0'
        }`}
      >
        ↕ 스크롤
      </span>
    </div>
    <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
      <div
        className={`overflow-y-auto overflow-x-hidden rounded-[36px] border-4 shadow-2xl bg-cream-bg [&::-webkit-scrollbar]:hidden transition-colors ${
          previewFocused ? 'border-gold' : 'border-brown-dark/30'
        }`}
        style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px`, scrollbarWidth: 'none' }}
        onClick={(e) => { e.stopPropagation(); setPreviewFocused(true) }}
      >
        <div style={{ width: `${INNER_W}px`, zoom: PREVIEW_SCALE, pointerEvents: 'none' }}>
          <ProductLandingPage product={previewProduct} />
        </div>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 4: 동작 수동 확인**

```
npm run dev
```

1. `/admin/qr/new` 접속
2. 미리보기 클릭 → 테두리 gold로 전환, "↕ 스크롤" 뱃지 나타남
3. 폼 영역 클릭 → 테두리 원래 색으로 복귀, 뱃지 사라짐
4. 미리보기 클릭 후 스크롤 → 미리보기 내부 스크롤만 작동 확인

- [ ] **Step 5: Commit**

```bash
git add app/admin/qr/new/page.tsx
git commit -m "feat: add preview focus indicator to new QR page"
```

---

### Task 2: EditClient.tsx — preview focus indicator

**Files:**
- Modify: `app/admin/qr/[id]/edit/EditClient.tsx`

현재 EditClient preview 영역 (line 236–262):
```tsx
{/* 실시간 미리보기 (내부 스크롤) */}
<div className="w-[400px] flex-shrink-0">
  <div className="sticky top-24">
    <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
      실시간 미리보기
    </p>
    <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
      <div
        className="overflow-y-auto overflow-x-hidden rounded-[36px] border-4 border-brown-dark/30 shadow-2xl bg-cream-bg [&::-webkit-scrollbar]:hidden"
        style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px`, scrollbarWidth: 'none' }}
      >
        <div style={{ width: `${INNER_W}px`, zoom: PREVIEW_SCALE, pointerEvents: 'none' }}>
          <ProductLandingPage product={previewProduct} />
        </div>
      </div>
      <p className="text-xs text-brown-muted text-center mt-2">
        입력한 내용이 즉시 반영됩니다
      </p>
    </div>
  </div>
</div>
```

- [ ] **Step 1: `previewFocused` state 추가**

`EditClient` 컴포넌트 내 state 선언 블록 끝(현재 `const [showModal, setShowModal] = useState(false)` 다음)에 추가:

```tsx
const [previewFocused, setPreviewFocused] = useState(false)
```

- [ ] **Step 2: `<main>` 에 outside-click 핸들러 추가**

EditClient 의 `<main>` 태그를 찾아:

기존:
```tsx
<main className="max-w-screen-xl mx-auto px-8 py-8">
```

변경:
```tsx
<main className="max-w-screen-xl mx-auto px-8 py-8" onClick={() => setPreviewFocused(false)}>
```

- [ ] **Step 3: 미리보기 영역을 뱃지 + 조건부 border로 교체**

기존 preview 블록(line 236~262)을 아래로 교체:

```tsx
{/* 실시간 미리보기 (내부 스크롤) */}
<div className="w-[400px] flex-shrink-0">
  <div className="sticky top-24">
    <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
      실시간 미리보기
    </p>
    {/* 포커스 뱃지 — h-6 공간 항상 예약, opacity로 fade */}
    <div className="flex justify-center mb-2 h-6">
      <span
        className={`text-[10px] bg-gold text-cream px-3 py-1 rounded-full font-bold transition-opacity ${
          previewFocused ? 'opacity-100' : 'opacity-0'
        }`}
      >
        ↕ 스크롤
      </span>
    </div>
    <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
      <div
        className={`overflow-y-auto overflow-x-hidden rounded-[36px] border-4 shadow-2xl bg-cream-bg [&::-webkit-scrollbar]:hidden transition-colors ${
          previewFocused ? 'border-gold' : 'border-brown-dark/30'
        }`}
        style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px`, scrollbarWidth: 'none' }}
        onClick={(e) => { e.stopPropagation(); setPreviewFocused(true) }}
      >
        <div style={{ width: `${INNER_W}px`, zoom: PREVIEW_SCALE, pointerEvents: 'none' }}>
          <ProductLandingPage product={previewProduct} />
        </div>
      </div>
      <p className="text-xs text-brown-muted text-center mt-2">
        입력한 내용이 즉시 반영됩니다
      </p>
    </div>
  </div>
</div>
```

- [ ] **Step 4: 동작 수동 확인**

```
npm run dev
```

1. `/admin/qr/{id}/edit` 접속
2. 미리보기 클릭 → 테두리 gold로 전환, "↕ 스크롤" 뱃지 나타남
3. 폼 영역 클릭 → 테두리 원래 색으로 복귀, 뱃지 사라짐
4. 탭 전환 후에도 포커스 상태가 의도대로 동작하는지 확인

- [ ] **Step 5: Commit**

```bash
git add app/admin/qr/[id]/edit/EditClient.tsx
git commit -m "feat: add preview focus indicator to edit page"
```
