# Content Library Implementation Design

## Goal

제품 설명 섹션의 공유 가능한 콘텐츠(모티브, 장소 등)를 라이브러리로 관리한다. 여러 제품이 동일한 설명(훈민정음, 달항아리, 경복궁 등)을 공유 참조하고, 제품 고유 설명(디자인 설명)은 기존 `product_sections`가 그대로 담당한다.

## Architecture

`notice_groups` / `closing_templates` 패턴과 동일. 공유 콘텐츠 테이블(`content_library`)을 신규 생성하고 `product_content_links` 연결 테이블로 제품과 N:M 관계를 구성. 기존 `product_sections`는 변경 없이 제품 고유 설명 전담. 렌더링 시 공유 콘텐츠 → 제품 고유 설명 순으로 고정 출력.

## Tech Stack

Next.js 15 App Router, Supabase PostgREST, TypeScript strict, Tailwind CSS v4, Vitest + Testing Library

---

## Data Layer

### 신규 테이블: `content_library`

```
content_library
  id    uuid  PRIMARY KEY DEFAULT gen_random_uuid()
  title text  NOT NULL   -- 훈민정음, 달항아리, 경복궁 등
  body  text  NOT NULL   -- 해당 항목의 설명
```

### 신규 테이블: `product_content_links`

```
product_content_links
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid()
  product_id  uuid  NOT NULL REFERENCES products(id) ON DELETE CASCADE
  content_id  uuid  NOT NULL REFERENCES content_library(id) ON DELETE CASCADE
  sort_order  int   NOT NULL DEFAULT 0
  CONSTRAINT uq_product_content UNIQUE (product_id, content_id)
```

`UNIQUE(product_id, content_id)` — 동일 제품에 같은 항목 중복 연결 방지.

### 기존 유지

`product_sections` — 변경 없음. 제품 고유 디자인 설명 전담.

### Migration 전략

`supabase/migrations/20260618000001_add_content_library.sql` 신규 파일. 기존 데이터 보존 증분 방식.

---

## API Layer

### 신규: `app/api/content-library/route.ts`

**GET** — 인증 불필요. 전체 목록 반환 (`id, title, body`, `title` 오름차순).

**POST** — 인증 필요 (`getAdminId`). `title`, `body` 필수. 201 반환.

### 신규: `app/api/qr/[id]/content-links/route.ts`

**POST** — 인증 필요. `{ content_id, sort_order }` 받아 `product_content_links` INSERT. 중복 시 409.

### 신규: `app/api/qr/[id]/content-links/[linkId]/route.ts`

**DELETE** — 인증 필요. `product_content_links` 해당 행 삭제.

**PATCH** — 인증 필요. `{ sort_order }` 받아 순서 업데이트.

### 기존 수정: `app/api/qr/route.ts` (POST)

QR 생성 시 `content_links` 배열 처리:

```ts
interface ContentLinkInput {
  content_id: string | null
  new_content: { title: string; body: string } | null
  sort_order: number
}
```

`new_content`가 있으면 `content_library`에 먼저 INSERT → 반환된 id로 `product_content_links` INSERT.
`content_id`가 있으면 바로 `product_content_links` INSERT.

### 기존 유지

`/api/qr/[id]/sections/*` — 변경 없음.

---

## Type Layer (`lib/types.ts`)

```ts
export interface ContentLibraryItem {
  id: string
  title: string
  body: string
}

export interface ProductContentLink {
  id: string
  sort_order: number
  content_library: ContentLibraryItem
}

// Product에 추가
product_content_links?: ProductContentLink[]
```

---

## UI Layer

### 신규: `components/admin/ContentLibraryPanel.tsx`

`SectionsPanel` / `NoticePanel`과 동일한 create/edit 이중 모드.

**create 모드** — 부모에게 `ContentLinkFormData[]` 콜백:
```ts
interface ContentLinkFormData {
  content_id: string | null
  new_content: { title: string; body: string } | null
  sort_order: number
}
```

**edit 모드** — 각 조작(추가/해제/순서변경)이 즉시 API 반영:
- 기존 항목 선택 → `POST /api/qr/[id]/content-links`
- 새 항목 생성 → `POST /api/content-library` → `POST /api/qr/[id]/content-links`
- 연결 해제 → `DELETE /api/qr/[id]/content-links/[linkId]`
- 순서 변경 → `PATCH /api/qr/[id]/content-links/[linkId]`

**인라인 UI:**

```
[라이브러리에서 선택 ▼]  [새 항목 만들기]

연결된 항목:
  ┌─────────────────────────────────────┐
  │ 훈민정음       ↑ ↓  [해제]         │
  │ 달항아리       ↑ ↓  [해제]         │
  └─────────────────────────────────────┘
```

새 항목 만들기 클릭 시:
```
┌──────────────────────────────────────────┐
│ 제목  [훈민정음                        ] │
│ 설명  [한국의 문자 체계로...           ] │
│       [확인]  [취소]                     │
└──────────────────────────────────────────┘
```

### 수정: `app/admin/qr/new/page.tsx`

- `contentLinks: ContentLinkFormData[]` state 추가
- useEffect에서 `/api/content-library` fetch → `contentLibrary` state
- 섹션 탭에 `ContentLibraryPanel` 추가 (SectionsPanel 위)
- POST body에 `content_links` 포함
- `previewProduct.product_content_links` 연결

### 수정: `app/admin/qr/[id]/edit/page.tsx`

- `content_library` fetch 추가 (Promise.all)
- `EditClient`에 `contentLibrary` prop 전달

### 수정: `app/admin/qr/[id]/edit/EditClient.tsx`

- `contentLibrary: ContentLibraryItem[]` prop 추가
- `contentLinks` state (초기값: `p?.product_content_links ?? []`)
- 섹션 탭에 `ContentLibraryPanel` 추가 (SectionsPanel 위)
- `previewProduct.product_content_links` 연결

---

## Rendering Layer

### 수정: `components/ProductLandingPage.tsx`

```
렌더링 순서 (고정):
1. product_content_links (sort_order 오름차순) → SectionCard
2. product_sections      (sort_order 오름차순) → SectionCard
3. closing_templates.body                      → 마무리 문구 블록
```

### 수정: Supabase 쿼리

`/r/[slug]/page.tsx` 및 `edit/page.tsx` 쿼리에 추가:

```
products (
  *,
  product_content_links ( id, sort_order, content_library ( id, title, body ) ),
  product_tags ( ... ),
  product_sections ( * ),
  notice_groups ( ... ),
  closing_templates ( ... )
)
```

---

## Out of Scope

- `content_library` 전용 관리 페이지 (인라인 생성으로 충분)
- 항목 수정/삭제 기능 (1차 구현 제외, 추후 설정 페이지에서 추가)
- 카테고리/태그로 라이브러리 항목 분류
