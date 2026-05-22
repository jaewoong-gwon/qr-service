# QrTable 2-Column Redesign Spec

**Date:** 2026-05-22
**Branch:** feat/ui-redesign-cream-gold
**File:** `components/QrTable.tsx`

---

## Goal

Improve readability and layout of the QR code card list in the admin dashboard. Replace the current compact single-row card with a two-column layout: QR code on the left, structured metadata on the right, and action buttons along the bottom edge.

## Architecture

Rewrite the card JSX inside the existing `items.map()` loop. No new components introduced. Modals (download, edit URL) are unchanged. The stats area is left as empty space with a comment marking it as a placeholder for a future `<QrStats>` component.

## Card Layout

```
┌────────────────────────────────────────────────────┐
│  ┌────────┐  레진 갓 키링                          │
│  │   QR   │  ──────────────────────────────────    │
│  │ (80px) │  생성일   2026.05.22                   │
│  │        │                                        │
│  └────────┘  [추후 통계 영역 — 현재 빈 공간]        │
│  ────────────────────────────────────────────────  │
│  [미리보기]  [다운로드]  [URL 변경]  [삭제]         │
└────────────────────────────────────────────────────┘
```

### Left column (fixed width: `w-24` = 96px)

- QR code rendered at `size={80}` via `<QRCode>` (currently 36px)
- Wrapper: `p-2 bg-cream border border-gold/30 rounded-lg flex items-center justify-center`
- Entire left column remains a `<button>` triggering `setDownloadItem` (existing behavior), with aria-label preserved

### Right column (`flex-1 min-w-0`)

- **Product name**: `text-base font-bold text-brown-dark` (up from `text-sm`)
- **Gold divider**: `w-8 h-px bg-gold my-2`
- **생성일 row**: `<span>` label (`text-xs text-brown-light`) + `<span>` value (`text-sm text-brown-dark`)
- **Stats placeholder**: empty `<div>` with `{/* 추후 통계 */}` comment — no visible content for now

### Bottom action row

Separated by `border-t border-gold/20 pt-2.5 mt-3 flex gap-2`.

| Button | Style |
|--------|-------|
| 미리보기 (Link) | `text-xs px-3 py-1.5 rounded bg-cream-bg text-brown-light border border-gold/30 hover:bg-gold/10` |
| 다운로드 | `text-xs px-3 py-1.5 rounded bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20` |
| URL 변경 | `text-xs px-3 py-1.5 rounded bg-cream-bg text-brown-light border border-gold/30 hover:bg-gold/10` |
| 삭제 | `text-xs px-3 py-1.5 rounded bg-red-50 text-red-500 border border-red-200 hover:bg-red-100` |

Button text size is `text-xs` (up from `text-[10px]`). Padding `px-3 py-1.5` (up from `px-2.5 py-1`).

### Removed from card

- Slug display (`item.slug`) — removed entirely
- Drive folder URL display — removed entirely (was never shown in previous version; will not be added)

## What Does NOT Change

- Empty state UI (dashed border placeholder)
- Download modal (`downloadItem &&` block with `<QrDisplay>`)
- Edit modal (`editingItem &&` block with drive_folder_url form)
- `handleDelete`, `handleUpdate`, `openEditModal`, `closeEditModal` logic
- `baseUrl` computation (`process.env.NEXT_PUBLIC_BASE_URL ?? ''`)

## Typography Summary

| Element | Before | After |
|---------|--------|-------|
| Product name | `text-sm font-bold` | `text-base font-bold` |
| Action buttons | `text-[10px] px-2.5 py-1` | `text-xs px-3 py-1.5` |
| Date (was slug·date) | `text-xs text-brown-light font-mono` | label + `text-sm` value |
| Slug | shown | removed |

## Testing

Existing `__tests__/components/QrTable.test.tsx` has 3 tests:
1. Empty state renders
2. Product name renders
3. Action buttons render (미리보기 link, URL 변경 button, 삭제 button)

Tests 1 and 2 pass without changes. Test 3 must still pass — button text labels are unchanged. Update the test mock for `QRCode` if the `size` prop assertion is tested (it is not currently). No new tests required beyond confirming existing 3 pass.
