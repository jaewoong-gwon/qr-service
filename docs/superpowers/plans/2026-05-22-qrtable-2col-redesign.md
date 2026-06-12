# QrTable 2-Column Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the compact single-row QR card with a two-column layout (QR left, metadata right, action buttons along the bottom) to improve readability and typographic hierarchy.

**Architecture:** Single file change — `components/QrTable.tsx`. The card JSX inside `items.map()` is replaced; all state, handlers, and modals are unchanged. Existing 3 unit tests cover the new layout without modification.

**Tech Stack:** Next.js (App Router), React, Tailwind v4 (`@theme inline` tokens), `react-qr-code`

**Spec:** `docs/superpowers/specs/2026-05-22-qrtable-2col-redesign.md`

---

## File Structure

- Modify: `components/QrTable.tsx` — card JSX only (lines 76–128)
- Test: `__tests__/components/QrTable.test.tsx` — no changes needed; existing 3 tests must still pass

---

### Task 1: Rewrite QrTable card to 2-column layout

**Files:**
- Modify: `components/QrTable.tsx`
- Test: `__tests__/components/QrTable.test.tsx`

---

- [ ] **Step 1: Confirm existing tests pass before touching any code**

```bash
npx vitest run __tests__/components/QrTable.test.tsx
```

Expected: 3 tests pass (`renders empty state`, `renders product name`, `renders action buttons`).

---

- [ ] **Step 2: Replace the card JSX inside `items.map()`**

Open `components/QrTable.tsx`. Find the block starting at the outer `<div key={item.id} ...>` (currently line 78) and ending just before `</div>` that closes the map (currently around line 128). Replace the entire card `<div>` with the following:

```tsx
<div
  key={item.id}
  className="bg-cream border border-gold/40 rounded-xl p-4"
>
  {/* Top: QR + metadata */}
  <div className="flex gap-4">
    {/* Left: QR thumbnail — clicking opens download modal */}
    <button
      onClick={() => setDownloadItem(item)}
      aria-label={`${item.products?.name ?? item.slug} QR 코드 다운로드`}
      className="p-2 bg-cream border border-gold/30 rounded-lg flex-shrink-0 flex items-center justify-center hover:opacity-70 transition-opacity"
      title="클릭하여 다운로드"
    >
      <QRCode value={`${baseUrl}/r/${item.slug}`} size={80} fgColor="#3D2B1F" bgColor="#F5EFE0" />
    </button>

    {/* Right: metadata */}
    <div className="flex-1 min-w-0 py-1">
      <p className="text-base font-bold text-brown-dark truncate">
        {item.products?.name ?? '-'}
      </p>
      <div className="w-8 h-px bg-gold my-2" />
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-brown-light flex-shrink-0">생성일</span>
        <span className="text-sm text-brown-dark">
          {new Date(item.created_at).toLocaleDateString('ko-KR')}
        </span>
      </div>
      {/* 추후 통계 */}
    </div>
  </div>

  {/* Bottom: action buttons */}
  <div className="border-t border-gold/20 pt-2.5 mt-3 flex gap-2">
    <Link
      href={`/r/${item.slug}`}
      target="_blank"
      className="text-xs px-3 py-1.5 rounded bg-cream-bg text-brown-light border border-gold/30 hover:bg-gold/10 transition-colors"
    >
      미리보기
    </Link>
    <button
      onClick={() => setDownloadItem(item)}
      className="text-xs px-3 py-1.5 rounded bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition-colors"
    >
      다운로드
    </button>
    <button
      onClick={() => openEditModal(item)}
      className="text-xs px-3 py-1.5 rounded bg-cream-bg text-brown-light border border-gold/30 hover:bg-gold/10 transition-colors"
    >
      URL 변경
    </button>
    <button
      onClick={() => handleDelete(item)}
      className="text-xs px-3 py-1.5 rounded bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors"
    >
      삭제
    </button>
  </div>
</div>
```

Also remove the outer wrapper `<div className="flex flex-col gap-2.5">` padding change: keep `gap-2.5` but update it to `gap-3` for slightly more breathing room between cards.

The complete updated `items.map()` block (replacing lines 76–128 of the current file):

```tsx
<div className="flex flex-col gap-3">
  {items.map((item) => (
    <div
      key={item.id}
      className="bg-cream border border-gold/40 rounded-xl p-4"
    >
      <div className="flex gap-4">
        <button
          onClick={() => setDownloadItem(item)}
          aria-label={`${item.products?.name ?? item.slug} QR 코드 다운로드`}
          className="p-2 bg-cream border border-gold/30 rounded-lg flex-shrink-0 flex items-center justify-center hover:opacity-70 transition-opacity"
          title="클릭하여 다운로드"
        >
          <QRCode value={`${baseUrl}/r/${item.slug}`} size={80} fgColor="#3D2B1F" bgColor="#F5EFE0" />
        </button>

        <div className="flex-1 min-w-0 py-1">
          <p className="text-base font-bold text-brown-dark truncate">
            {item.products?.name ?? '-'}
          </p>
          <div className="w-8 h-px bg-gold my-2" />
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-brown-light flex-shrink-0">생성일</span>
            <span className="text-sm text-brown-dark">
              {new Date(item.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
          {/* 추후 통계 */}
        </div>
      </div>

      <div className="border-t border-gold/20 pt-2.5 mt-3 flex gap-2">
        <Link
          href={`/r/${item.slug}`}
          target="_blank"
          className="text-xs px-3 py-1.5 rounded bg-cream-bg text-brown-light border border-gold/30 hover:bg-gold/10 transition-colors"
        >
          미리보기
        </Link>
        <button
          onClick={() => setDownloadItem(item)}
          className="text-xs px-3 py-1.5 rounded bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition-colors"
        >
          다운로드
        </button>
        <button
          onClick={() => openEditModal(item)}
          className="text-xs px-3 py-1.5 rounded bg-cream-bg text-brown-light border border-gold/30 hover:bg-gold/10 transition-colors"
        >
          URL 변경
        </button>
        <button
          onClick={() => handleDelete(item)}
          className="text-xs px-3 py-1.5 rounded bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  ))}
</div>
```

---

- [ ] **Step 3: Run tests to verify they still pass**

```bash
npx vitest run __tests__/components/QrTable.test.tsx
```

Expected output:
```
✓ __tests__/components/QrTable.test.tsx (3)
  ✓ QrTable > renders empty state when no items
  ✓ QrTable > renders product name for each item
  ✓ QrTable > renders action buttons

Test Files  1 passed (1)
Tests  3 passed (3)
```

If any test fails, check:
- `미리보기` Link text is still present → it is, in the bottom button row
- `URL 변경` button text is still present → it is
- `삭제` button text is still present → it is
- `생성된 QR 코드가 없습니다.` empty state is unchanged → it is (empty state block above the map is untouched)
- `레진 갓 키링` product name renders → it does, via `item.products?.name ?? '-'`

---

- [ ] **Step 4: Run full unit test suite to check for regressions**

```bash
npx vitest run
```

Expected: 22 tests pass (all existing tests). If count differs, investigate before committing.

---

- [ ] **Step 5: Commit**

```bash
git add components/QrTable.tsx
git commit -m "feat: redesign QrTable as 2-column card layout with improved typography"
```
