# Product Sections Admin Editor — Design Spec

**Date:** 2026-06-09
**Branch:** feat/ui-redesign-cream-gold
**Sub-project:** 2 of 2 (Admin Editor). Sub-project 1 (Renderer) is complete.

---

## Goal

Allow admins to create, edit, reorder, and delete `product_sections` for any product via an admin UI. Accessed after QR creation or from the dashboard.

---

## User Flow

1. Admin creates a new QR code at `/admin/qr/new` → on success, redirects to `/admin/qr/[id]/sections`
2. Admin visits the dashboard → clicks "섹션" button on any row → navigates to `/admin/qr/[id]/sections`
3. On the sections page, admin can:
   - View all existing sections as draggable cards
   - Drag to reorder (display_order updates persist on drop)
   - Click a card to expand inline editing form
   - Save / cancel inline edits
   - Delete a section (with confirmation)
   - Add a new section via "섹션 추가" button → type selector → inline form

---

## Architecture

### New Pages

**`/admin/qr/[id]/sections`** (`app/admin/qr/[id]/sections/page.tsx`)
- Server component: fetches `qr_code` + `product` + `product_sections` (ordered by `display_order`)
- Passes data to `SectionList` client component

### New API Routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/products/[productId]/sections` | Fetch all sections |
| `POST` | `/api/products/[productId]/sections` | Create a section |
| `PATCH` | `/api/products/[productId]/sections/[sectionId]` | Update a section |
| `DELETE` | `/api/products/[productId]/sections/[sectionId]` | Delete a section |
| `PATCH` | `/api/products/[productId]/sections/reorder` | Bulk update display_order |

Reorder payload: `{ sections: [{ id: string, display_order: number }] }`

### New Components

```
components/admin/sections/
  SectionList.tsx          ← 'use client', DnD container, holds all state
  SectionCard.tsx          ← draggable card, toggles inline form
  SectionTypeSelector.tsx  ← grid of 7 section type buttons (shown when adding)
  SectionForm.tsx          ← routes to type-specific form based on section_type
  forms/
    HeroForm.tsx
    TextBlockForm.tsx
    FeatureCardsForm.tsx
    SpecsForm.tsx
    RecommendListForm.tsx
    QuoteForm.tsx
    PhotoSectionForm.tsx
lib/
  drive.ts                 ← parseDriveId(input): string — URL or raw ID
```

### Changes to Existing Files

| File | Change |
|------|--------|
| `app/admin/qr/new/page.tsx` | On success: `router.push('/admin/qr/[id]/sections')` instead of showing QR result inline |
| `components/QrTable.tsx` | Add "섹션" link button per row → `/admin/qr/[id]/sections` |

---

## Component Design

### SectionList

- Holds `sections: ProductSection[]` in state
- Wraps content in `@dnd-kit/core` `DndContext` + `@dnd-kit/sortable` `SortableContext`
- On drag end: reorders local state immediately (optimistic), calls `PATCH /reorder`
- Renders `SectionCard` per section + "섹션 추가" button at bottom
- "섹션 추가" toggles `SectionTypeSelector` which, on type selection, appends a new blank card in edit mode

### SectionCard

- Draggable via `@dnd-kit/sortable` `useSortable`
- Header row: drag handle icon, section type label (e.g. "HERO"), edit button, delete button
- Body: collapsed by default; expanded = `SectionForm` for this section
- Save: calls `POST` (new) or `PATCH` (existing), updates local state, collapses
- Delete: calls `DELETE`, removes from local state (no confirmation modal — direct action with undo-friendly instant removal)
- Cancel: reverts to last saved state, collapses

### SectionForm

Routes to type-specific form component based on `section_type`. All forms share:
- `inputClass`, `labelClass` from the existing admin page style tokens
- A `DriveUrlInput` sub-component for image fields — accepts URL or ID, calls `parseDriveId`, shows parsed ID as hint

### Type-specific Forms

| Form | Required fields | Optional fields | Array fields |
|------|----------------|-----------------|--------------|
| `HeroForm` | title, subtitle | body, image_drive_id | — |
| `TextBlockForm` | heading, body | subheading, icon_drive_id | — |
| `FeatureCardsForm` | heading | — | cards[]: icon_drive_id, title*, description* |
| `SpecsForm` | heading | note | items[]: image_drive_id, label* |
| `RecommendListForm` | heading | — | items[]: string* |
| `QuoteForm` | text | attribution | — |
| `PhotoSectionForm` | image_drive_id | heading, body | — |

Array fields have "+ 추가" and "× 삭제" controls per item.

### DriveUrlInput (`lib/drive.ts`)

```ts
// parseDriveId: extracts file ID from Drive URL or returns input as-is if no URL pattern found
// Patterns handled:
//   https://drive.google.com/file/d/[ID]/view
//   https://drive.google.com/open?id=[ID]
//   https://drive.google.com/uc?id=[ID]
//   plain ID (no slash) → returned as-is
export function parseDriveId(input: string): string
```

---

## Visual Design

Follows existing admin page conventions (`cream-bg`, `gold/30` borders, `brown-dark` text).

**Sections page nav:**
```
← 대시보드    [제품명]
              SECTIONS
```

**SectionCard (collapsed):**
```
[≡] HERO    [편집] [삭제]
```

**SectionCard (expanded):**
```
[≡] HERO    [저장] [취소] [삭제]
─────────────────────────────
[title input      ]
[subtitle input   ]
[body textarea    ]
[image Drive URL  ]  → parsed ID hint
```

**SectionTypeSelector (shown above "섹션 추가" after click):**
- 2-column grid of 7 type buttons (HERO, 텍스트 블록, 피처 카드, 스펙, 추천 목록, 인용구, 사진)
- Clicking a type creates a new `SectionCard` in edit mode at bottom of list

---

## State Management

All state lives in `SectionList`. No external store needed.

```
sections: ProductSection[]        ← server-fetched initial value
addingType: SectionType | null    ← null = not adding
```

Optimistic updates on reorder: local state updates immediately, API call in background. On error, re-fetches from server.

---

## Error Handling

- API errors surface as inline error text below the save button ("저장 실패: [message]")
- Reorder failures: re-fetch sections from server to resync order
- Drive ID parse failure: show warning hint but still allow saving

---

## Dependencies

Add: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

---

## Out of Scope

- Image upload to Drive (Drive ID is entered manually)
- Section preview within admin
- Multi-product bulk section editing