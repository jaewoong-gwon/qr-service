# Preview Hover Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 미리보기 포커스 UI 트리거를 클릭 → 호버로 교체한다 (마우스가 미리보기 div를 벗어나면 즉시 비활성화).

**Architecture:** 두 파일(`new/page.tsx`, `EditClient.tsx`) 각각에서 preview div의 `onClick`+`stopPropagation`을 제거하고 `onMouseEnter`/`onMouseLeave`로 교체한다. `<main>`의 `onClick={() => setPreviewFocused(false)}`도 함께 제거한다. `previewFocused` state와 badge/border 조건부 클래스는 그대로 유지.

**Tech Stack:** React 19 synthetic events (`onMouseEnter`, `onMouseLeave`), Next.js 15 App Router Client Component, Tailwind CSS v4

---

## File Structure

| 파일 | 변경 내용 |
|---|---|
| `app/admin/qr/new/page.tsx` | line 163 `<main>` onClick 제거, line 225 preview div onClick → onMouseEnter/onMouseLeave 교체 |
| `app/admin/qr/[id]/edit/EditClient.tsx` | line 133 `<main>` onClick 제거, line 260 preview div onClick → onMouseEnter/onMouseLeave 교체 |

---

### Task 1: new/page.tsx — hover 트리거로 교체

**Files:**
- Modify: `app/admin/qr/new/page.tsx:163,225`

현재 상태 (line 163):
```tsx
<main className="max-w-screen-xl mx-auto px-8 py-8" onClick={() => setPreviewFocused(false)}>
```

현재 상태 (line 225):
```tsx
onClick={(e) => { e.stopPropagation(); setPreviewFocused(true) }}
```

- [ ] **Step 1: `<main>` onClick 제거**

`app/admin/qr/new/page.tsx` line 163을 다음으로 교체:

```tsx
<main className="max-w-screen-xl mx-auto px-8 py-8">
```

- [ ] **Step 2: preview div를 onMouseEnter/onMouseLeave로 교체**

`app/admin/qr/new/page.tsx` line 225의 `onClick` prop을 아래 두 prop으로 교체:

```tsx
onMouseEnter={() => setPreviewFocused(true)}
onMouseLeave={() => setPreviewFocused(false)}
```

결과적으로 preview div의 전체 props:

```tsx
<div
  className={`overflow-y-auto overflow-x-hidden rounded-[36px] border-4 shadow-2xl bg-cream-bg [&::-webkit-scrollbar]:hidden transition-colors ${
    previewFocused ? 'border-gold' : 'border-brown-dark/30'
  }`}
  style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px`, scrollbarWidth: 'none' }}
  onMouseEnter={() => setPreviewFocused(true)}
  onMouseLeave={() => setPreviewFocused(false)}
>
```

- [ ] **Step 3: 타입스크립트 오류 없는지 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 4: Commit**

```bash
git add app/admin/qr/new/page.tsx
git commit -m "refactor: switch preview focus trigger to hover in new QR page"
```

---

### Task 2: EditClient.tsx — hover 트리거로 교체

**Files:**
- Modify: `app/admin/qr/[id]/edit/EditClient.tsx:133,260`

현재 상태 (line 133):
```tsx
<main className="max-w-screen-xl mx-auto px-8 py-8" onClick={() => setPreviewFocused(false)}>
```

현재 상태 (line 260):
```tsx
onClick={(e) => { e.stopPropagation(); setPreviewFocused(true) }}
```

- [ ] **Step 1: `<main>` onClick 제거**

`app/admin/qr/[id]/edit/EditClient.tsx` line 133을 다음으로 교체:

```tsx
<main className="max-w-screen-xl mx-auto px-8 py-8">
```

- [ ] **Step 2: preview div를 onMouseEnter/onMouseLeave로 교체**

`app/admin/qr/[id]/edit/EditClient.tsx` line 260의 `onClick` prop을 아래 두 prop으로 교체:

```tsx
onMouseEnter={() => setPreviewFocused(true)}
onMouseLeave={() => setPreviewFocused(false)}
```

결과적으로 preview div의 전체 props:

```tsx
<div
  className={`overflow-y-auto overflow-x-hidden rounded-[36px] border-4 shadow-2xl bg-cream-bg [&::-webkit-scrollbar]:hidden transition-colors ${
    previewFocused ? 'border-gold' : 'border-brown-dark/30'
  }`}
  style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px`, scrollbarWidth: 'none' }}
  onMouseEnter={() => setPreviewFocused(true)}
  onMouseLeave={() => setPreviewFocused(false)}
>
```

- [ ] **Step 3: 타입스크립트 오류 없는지 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 4: Commit**

```bash
git add app/admin/qr/[id]/edit/EditClient.tsx
git commit -m "refactor: switch preview focus trigger to hover in edit page"
```

---

### Task 3: 수동 동작 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: dev server 실행**

```bash
npm run dev
```

- [ ] **Step 2: new 페이지 검증**

`/admin/qr/new` 접속 후:
1. 미리보기에 마우스 올림 → 테두리 gold + "↕ 스크롤" 뱃지 나타남
2. 미리보기에서 마우스 벗어남 → 즉시 테두리 원래 색 + 뱃지 사라짐
3. 폼 입력 후 스크롤 → 미리보기에 마우스 없을 때 포커스 UI 없음

- [ ] **Step 3: edit 페이지 검증**

`/admin/qr/{id}/edit` 접속 후:
1. 미리보기에 마우스 올림 → 테두리 gold + "↕ 스크롤" 뱃지 나타남
2. 미리보기에서 마우스 벗어남 → 즉시 비활성화
3. 탭 전환 후에도 동일하게 동작

- [ ] **Step 4: 기존 테스트 통과 확인**

```bash
npm test
```

Expected: 모든 테스트 통과.
