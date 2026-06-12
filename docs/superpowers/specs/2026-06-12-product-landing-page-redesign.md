# Product Landing Page Redesign — Implementation Spec

## Goal

오프라인 매장 고객이 QR을 스캔한 직후 보는 제품 안내 페이지를 재설계한다.
단순 텍스트 blob 구조를 의미 단위 섹션 기반 구조로 전환하고,
DB와 렌더링 레이어를 분리하여 제품마다 다른 설명 구조를 유연하게 수용한다.

---

## 서비스 컨텍스트

- 고객은 **오프라인 매장에서 실물을 확인한 뒤** QR을 스캔한다.
- 자체 페이지는 긴 쇼핑몰 상세페이지가 아니라 **짧은 제품 안내 카드**다.
- 아이디어스에 상세 사진과 설명이 이미 있으므로 자체 페이지는 연결 역할을 한다.
- 페이지 목적 우선순위:
  1. 구매 전 확인사항 전달
  2. 간략한 작품 소개 전달
  3. 아이디어스 페이지로 유도

---

## 설계 원칙

- 기존 원문 내용을 임의로 수정하거나 삭제하지 않는다.
- 문장을 새로 창작하지 않는다.
- 원문 데이터를 역할별로 분류해서 저장하고 렌더링하는 구조를 설계한다.
- 처음부터 복잡한 관리자용 섹션 빌더를 구현하지 않는다.
- MVP에서 섹션 데이터 입력은 Supabase에서 직접 입력하는 방식을 허용한다.

---

## DB 설계

### 기존 테이블 (변경 없음)

```sql
qr_codes (id, slug, drive_folder_url, created_at)
```

QR 슬러그 생성·관리, 어드민 대시보드, 다운로드 기능이 모두 이 테이블 기준으로 작동한다.
`products`는 `qr_code_id` FK를 유지한다.

### products 테이블 재구성

```sql
products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id    uuid NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  name          text NOT NULL,
  subtitle      text,          -- 한 줄 카피 (기존 description)
  summary       text,          -- 짧은 요약 문단 (hero 하단 선택 표시)
  idus_url      text,
  notice_group_id uuid REFERENCES notice_groups(id),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
)
```

**제거되는 기존 컬럼:** `description`, `body`, `quote`, `keywords`, `purchase_notes`

### 신규 테이블

```sql
-- 구매 전 확인사항 공통 그룹
notice_groups (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL   -- 예: "레진 상품 공통"
)

notice_group_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_group_id  uuid NOT NULL REFERENCES notice_groups(id) ON DELETE CASCADE,
  content          text NOT NULL,
  sort_order       int NOT NULL DEFAULT 0
)

-- 키워드 태그 (pill 형태 표시)
product_tags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label       text NOT NULL,
  sort_order  int NOT NULL DEFAULT 0
)

-- 제품 설명 섹션
product_sections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  section_type text NOT NULL,  -- 아래 enum 참조
  title        text,           -- 섹션 제목 (없어도 됨)
  body         text,           -- 본문 텍스트
  sort_order   int NOT NULL DEFAULT 0
)

-- 섹션 내 개별 아이템 (색상/상징 의미 목록 등)
product_section_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  uuid NOT NULL REFERENCES product_sections(id) ON DELETE CASCADE,
  title       text,       -- 예: "청(靑)"
  description text,       -- 예: "성장, 희망, 생명력을 뜻합니다"
  sort_order  int NOT NULL DEFAULT 0
)
```

### section_type 목록 (MVP)

| 값 | 의미 | 렌더링 방식 | 사용 제품 |
|---|------|-----------|---------|
| `meaning` | 제품 또는 소재의 상징 의미 | 본문 카드 | 거의 전 제품 |
| `description` | 제품 자체 설명 | 본문 카드 | 전 제품 |
| `color_meaning` | 색상별 의미 | 아이템 그리드 카드 | 부채, 갓, 복주머니, 토트백 |
| `symbol_meaning` | 상징별 의미 | 아이템 그리드 카드 | 달항아리, 백자, 북어, 단청 |
| `option_story` | 문양·버전 선택 요소 설명 | 본문 카드 | 단청 소품, 부산타워 마그넷 |
| `character_story` | 캐릭터 설명 | 본문 카드 | 부용이 마그넷 |
| `place_story` | 장소 설명 | 본문 카드 | 부용이 마그넷, 부산타워 마그넷 |
| `closing` | 마무리 감성 문구 | 인용구 스타일 카드 | 전 제품 |

`material`, `craft_note`는 실제 데이터에서 별도 섹션으로 분리된 사례가 없으므로 MVP에서 제외한다.

### CASCADE 정책

```
qr_codes 삭제 → products 삭제 (CASCADE)
products 삭제 → product_tags, product_sections, product_section_items 삭제 (CASCADE)
notice_groups 삭제 → notice_group_items 삭제 (CASCADE)
```

### notice_groups 공유 구조

레진 상품 공통 안내 (3개 항목)를 1개 그룹으로 관리한다. 레진 제품 8종이 동일 그룹을 참조한다. 한지연사 제품은 별도 그룹을 생성하거나 `notice_group_id`를 null로 둔다.

---

## 모바일 화면 구조

```
┌─────────────────────────┐
│  [Hero]                  │
│  subtitle (한 줄 카피)    │
│  name (제품명, 대형)      │
│  tags (pill)             │
│  summary (있으면)         │
├─────────────────────────┤
│  [구매 전 확인사항]       │  ← 최상단 우선 노출
│  체크리스트 카드          │
├─────────────────────────┤
│  [Drive 이미지 갤러리]    │
│  수평 스크롤              │
├─────────────────────────┤
│  [product_sections]      │
│  sort_order 순 렌더링     │
│                         │
│  section_type별 디자인:  │
│                         │
│  meaning/description     │
│  → 제목 + 본문 카드       │
│                         │
│  closing                 │
│  → 인용구 스타일 카드     │
│                         │
│  color_meaning /         │
│  symbol_meaning          │
│  → 제목 + 아이템 그리드   │
│    (title · description) │
│                         │
│  character_story /       │
│  place_story /           │
│  option_story            │
│  → 제목 + 본문 카드       │
├─────────────────────────┤
│  [아이디어스 CTA]         │
│  "더 많은 작품 사진과     │
│   자세한 설명은           │
│   아이디어스에서          │
│   확인하실 수 있습니다."  │
│  [아이디어스 작품 페이지  │
│   보기]                  │
└─────────────────────────┘
```

**아이디어스 CTA 문구:**
- 안내 텍스트: "더 많은 작품 사진과 자세한 설명은 아이디어스에서 확인하실 수 있습니다."
- 버튼: "아이디어스 작품 페이지 보기"
- "구매하기" 표현 사용 금지

---

## 데이터 fetch 구조

### 랜딩 페이지 쿼리 (`app/r/[slug]/page.tsx`)

```ts
supabase
  .from('qr_codes')
  .select(`
    *,
    products (
      *,
      product_tags ( label, sort_order ),
      notice_groups ( notice_group_items ( content, sort_order ) ),
      product_sections (
        *, product_section_items ( title, description, sort_order )
      )
    )
  `)
  .eq('slug', slug)
  .single()
```

Drive 이미지는 기존과 동일하게 `getFolderImages(qrCode.drive_folder_url)`로 병렬 fetch한다.

---

## TypeScript 타입 구조

```ts
// lib/types.ts

export interface QrCode {
  id: string
  slug: string
  drive_folder_url: string
  created_at: string
}

export interface NoticeGroupItem {
  content: string
  sort_order: number
}

export interface NoticeGroup {
  notice_group_items: NoticeGroupItem[]
}

export interface ProductTag {
  label: string
  sort_order: number
}

export interface ProductSectionItem {
  title: string | null
  description: string | null
  sort_order: number
}

export type SectionType =
  | 'meaning'
  | 'description'
  | 'color_meaning'
  | 'symbol_meaning'
  | 'option_story'
  | 'character_story'
  | 'place_story'
  | 'closing'

export interface ProductSection {
  id: string
  section_type: SectionType
  title: string | null
  body: string | null
  sort_order: number
  product_section_items: ProductSectionItem[]
}

export interface Product {
  id: string
  qr_code_id: string
  name: string
  subtitle: string | null
  summary: string | null
  idus_url: string | null
  is_active: boolean
  product_tags: ProductTag[]
  notice_groups: NoticeGroup | null
  product_sections: ProductSection[]
}

export interface QrCodeWithProduct extends QrCode {
  products: Product | null
}
```

---

## 어드민 편집 UI 범위 (MVP)

MVP 편집 UI는 **기본 정보만** 처리한다.

편집 가능 항목:
- `drive_folder_url` (qr_codes)
- `name`, `subtitle`, `summary`, `idus_url`, `notice_group_id` (products)

섹션(`product_sections`), 태그(`product_tags`), 안내(`notice_group_items`) 편집은 **Supabase 대시보드에서 직접 입력**한다. 어드민 UI 확장은 추후 단계에서 구현한다.

---

## 마이그레이션 전략

1. 새 테이블(`product_tags`, `product_sections`, `product_section_items`, `notice_groups`, `notice_group_items`) 추가
2. `products` 테이블에 새 컬럼(`subtitle`, `summary`, `notice_group_id`, `is_active`) 추가
3. 기존 데이터 수동 이전: `description` → `subtitle`, `body`/`quote`/`keywords` → 각 섹션/태그 테이블
4. 이전 완료 확인 후 기존 컬럼 제거

기존 컬럼은 이전 완료 전까지 DROP하지 않는다.

---

## PR 단위 작업 계획

### PR 1 — DB 스키마 + TypeScript 타입

**목적:** 새 테이블 구조 반영 및 타입 정의 확립

**범위:**
- Supabase SQL 마이그레이션 작성 (신규 테이블 생성, products 컬럼 추가)
- `lib/types.ts` 전면 재작성
- `lib/supabase.ts` Database 타입 업데이트

**검증:** `npx tsc --noEmit` 통과, Supabase 테이블 생성 확인

---

### PR 2 — 랜딩 페이지 fetch 레이어 교체

**목적:** `/r/[slug]` 데이터 조회를 새 스키마로 전환

**범위:**
- `app/r/[slug]/page.tsx` — 중첩 select 쿼리로 교체
- `components/ProductLandingPage.tsx` — 새 props 타입 수용, 렌더링은 임시 유지

**검증:** 제품 페이지 접근 시 빈 상태 또는 기본 정보 정상 렌더링

---

### PR 3 — ProductLandingPage 섹션 렌더러 구현

**목적:** `section_type`별 카드 렌더링 컴포넌트 구현

**범위:**
- `components/ProductLandingPage.tsx` — 전체 화면 구조 (구매 전 확인사항 최상단 포함)
- `components/sections/SectionCard.tsx` — meaning, description, closing 렌더링
- `components/sections/ItemGridCard.tsx` — color_meaning, symbol_meaning 그리드
- Drive 이미지 갤러리, 태그 pill, 아이디어스 CTA 유지

**검증:** 각 section_type에 테스트 데이터를 직접 DB에 입력 후 렌더링 확인

---

### PR 4 — 어드민 API 업데이트

**목적:** QR 생성/수정 API를 새 products 스키마에 맞게 교체

**범위:**
- `app/api/qr/route.ts` POST — name, subtitle, summary, idus_url만 처리
- `app/api/qr/[id]/route.ts` PATCH — 동일 필드만 처리
- `components/QrTable.tsx` — `product.description` → `product.subtitle` rename

**검증:** 새 QR 생성 및 수정 후 대시보드 정상 표시

---

### PR 5 — 어드민 편집 UI 업데이트

**목적:** EditClient를 새 스키마 기본 정보 기준으로 교체

**범위:**
- `app/admin/qr/[id]/edit/EditClient.tsx` — name, subtitle, summary, idus_url, notice_group_id 편집
- `app/admin/qr/[id]/edit/page.tsx` — 새 쿼리로 교체
- `app/admin/qr/new/page.tsx` — 신규 생성 폼 업데이트

**검증:** 기본 정보 수정 저장, 미리보기에 subtitle/tags 반영 확인
