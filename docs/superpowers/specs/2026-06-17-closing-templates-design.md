# Closing Templates Implementation Design

## Goal

마무리 문구를 여러 버전의 공유 템플릿으로 관리한다. 현재 `product_sections`의 `'closing'` 타입 섹션을 대체하고, 여러 제품이 동일 템플릿을 참조해 일괄 수정이 가능하게 한다.

## Architecture

`notice_groups` 패턴과 동일. 공유 템플릿 테이블을 만들고 `products`에서 FK로 참조. 단, 마무리 문구는 리스트가 아닌 단일 텍스트 블록이므로 하위 items 테이블 없이 단일 테이블로 처리.

## Tech Stack

Next.js 15 App Router, Supabase PostgREST, TypeScript strict, Tailwind CSS v4

---

## Data Layer

### 신규 테이블: `closing_templates`

```
closing_templates
  id    uuid  PRIMARY KEY DEFAULT gen_random_uuid()
  name  text  NOT NULL   -- 관리자 구분용 레이블 (예: "레진 키링 마무리")
  body  text  NOT NULL   -- 실제 랜딩 페이지에 표시될 마무리 문구
```

### `products` 컬럼 추가

```
closing_template_id  uuid  REFERENCES closing_templates(id) ON DELETE SET NULL
```

### `product_sections` 제약 변경

현재: `CHECK (section_type IN ('meaning', 'closing'))`
변경: `CHECK (section_type IN ('meaning'))`

마무리 문구는 이제 `closing_template_id`로만 관리. `product_sections`는 제품 고유 추가 설명(`meaning`)에만 사용.

---

## API Layer

### 신규: `app/api/closing-templates/route.ts`

**GET** — 인증 불필요. 전체 목록 반환 (`id, name, body`, `name` 오름차순)

**POST** — 인증 필요 (`getAdminId`). `name`, `body` 필수. 201 반환.

### 기존 수정: `app/api/qr/route.ts` (POST)

`closing_template_id` 파라미터 추출 후 `products` insert에 포함.

### 기존 수정: `app/api/qr/[id]/route.ts` (PATCH)

`closing_template_id`가 body에 있으면 `products` update에 포함.

---

## Type Layer (`lib/types.ts`)

```ts
export interface ClosingTemplate {
  id: string
  name: string
  body: string
}

// Product에 추가
closing_template_id?: string | null
closing_templates?: ClosingTemplate | null
```

---

## UI Layer

### 신규: `components/admin/ClosingTemplatePanel.tsx`

`NoticePanel`과 동일한 UX 패턴. create/edit 두 모드.

**create 모드** — `closingData: { templateId: string } | { newTemplate: { name: string; body: string } } | null`을 부모로 콜백.

**edit 모드** — 두 가지 경우로 처리:
- 기존 템플릿 선택 → 즉시 `PATCH /api/qr/[id]` (`closing_template_id` 전달)
- 새 템플릿 생성 → `POST /api/closing-templates`로 먼저 생성 → 반환된 id로 `PATCH /api/qr/[id]`

**인라인 UI 흐름:**

```
드롭다운: [기존 템플릿 선택 ▼]  +  [새 템플릿 만들기] 버튼

→ 새 템플릿 만들기 클릭 시:
  이름 input + body textarea + [확인][취소]

→ 선택/생성 완료 시:
  선택됨: "레진 키링 마무리" — "오래 함께하는..." [수정]
```

### 수정: `components/admin/SectionsPanel.tsx`

`SECTION_TYPES`에서 `'closing'` 제거. `'meaning'`(추가 설명)만 남김.

### 수정: `app/admin/qr/new/page.tsx`

- `closingTemplates: ClosingTemplate[]` state 추가 (useEffect에서 `/api/closing-templates` fetch)
- `closingData` state 추가
- `previewProduct.closing_templates` 연결 (선택된 templateId로 템플릿 객체 찾아서 주입)
- POST body에 `closing_template_id` 포함

### 수정: `app/admin/qr/[id]/edit/EditClient.tsx`

- `closingTemplates: ClosingTemplate[]` prop 추가
- `closingTemplateId` state (초기값: `p?.closing_template_id ?? null`)
- 섹션 탭 하단에 `ClosingTemplatePanel` 추가
- `previewProduct.closing_templates` 연결

### 수정: `app/admin/qr/[id]/edit/page.tsx`

`closing_templates` 목록 fetch 후 `EditClient`에 prop으로 전달.

---

## Rendering Layer

### 수정: `components/ProductLandingPage.tsx`

현재: `product_sections`를 순회해서 `SectionCard` 출력 (closing 타입 포함)

변경:
1. `product_sections` (meaning 타입만) → `SectionCard`로 순서대로 출력
2. `product.closing_templates?.body`가 있으면 → `SectionCard` closing 스타일로 **맨 마지막에 고정** 출력

### Supabase 쿼리 변경 (랜딩 + edit page)

```
products (
  *,
  closing_templates ( id, name, body ),
  product_tags ( ... ),
  product_sections ( ... ),
  notice_groups ( ... )
)
```

---

## Migration 전략

`20260616000000_product_schema.sql` 수정 (신규 파일 생성 금지):

1. `closing_templates` 테이블 추가
2. `products`에 `closing_template_id` 컬럼 추가
3. `product_sections.section_type` CHECK 제약 변경 (`'closing'` 제거)

기존 `section_type='closing'` 데이터가 있으면 마이그레이션 전 수동 정리 필요 (현재 실데이터 없음).

---

## Out of Scope

- `closing_templates` 전용 관리 페이지 (인라인 생성으로 충분)
- 템플릿 수정/삭제 기능 (1차 구현에서 제외, 추후 설정 페이지에서 추가)
- `motifs` 테이블 (제품 수가 늘어나면 별도 설계)
