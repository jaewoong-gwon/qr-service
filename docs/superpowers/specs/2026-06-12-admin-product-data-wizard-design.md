# Admin Product Data Wizard & Editor Design

## Goal

QR 생성 시 모든 제품 데이터(기본정보, 태그, 섹션, 구매안내)를 단계별 wizard로 입력하고, 수정 페이지에서도 동일한 컴포넌트로 편집 가능하게 한다.

## Architecture

공유 Panel 컴포넌트를 `components/admin/`에 두고, `/qr/new` wizard와 `/edit` 페이지 양쪽에서 재사용한다. Panel은 `mode="create"` / `mode="edit"` prop으로 동작을 분기한다.

- **create 모드**: onChange 콜백으로 부모 state 업데이트 (DB 저장 없음)
- **edit 모드**: 변경 시 API 직접 호출 (즉시 저장)

## Tech Stack

- Next.js 16 App Router, React 19, TypeScript strict
- Supabase (postgres), Tailwind CSS v4

---

## 흐름

### `/qr/new` — 5단계 Wizard

| 단계 | 내용 |
|------|------|
| 1. 기본 정보 | name, subtitle, summary, drive_folder_url, idus_url |
| 2. 태그 | product_tags (label 목록) |
| 3. 섹션 | product_sections + product_section_items |
| 4. 구매 안내 | notice_group 선택 또는 신규 생성 |
| 5. 확인 및 완료 | 전체 요약 + "완료" 버튼 → DB 일괄 저장 |

- 오른쪽 미리보기는 모든 단계에서 항상 표시 (현재 입력 내용 실시간 반영)
- "완료" 전까지 DB 저장 없음 — 브라우저 state만 유지
- "완료" 시 `POST /api/qr` 한 번으로 전체 저장

### `/admin/qr/[id]/edit` — Panel 추가

- 상단: 기존 기본 정보 폼 유지
- 하단: `TagsPanel`, `SectionsPanel`, `NoticePanel` 카드 추가
- 각 Panel은 변경 즉시 개별 API 호출로 저장

---

## 컴포넌트 구조

### 공유 Panel 컴포넌트

**`TagsPanel`**
- props: `tags: ProductTag[]`, `onChange(tags)` (create) | `productId` (edit)
- UI: 텍스트 입력 + Enter로 태그 추가, ✕ 버튼으로 삭제, pill 표시

**`SectionsPanel`**
- props: `sections: ProductSection[]`, `onChange(sections)` (create) | `productId` (edit)
- UI: 섹션 카드 목록, "섹션 추가" 버튼
- 각 섹션 카드: `section_type` 드롭다운, `title`/`body` 입력, 순서 변경(↑↓), 삭제
- `color_meaning` / `symbol_meaning` 타입 선택 시 아이템 추가/삭제 sub-form 노출

**`NoticePanel`**
- props: `noticeGroupId: string | null`, `groups: NoticeGroup[]`, `onChange` (create) | `productId` (edit)
- UI: 기존 그룹 선택 드롭다운 OR "새 그룹 만들기" 토글
- 새 그룹: 그룹명 + 항목 텍스트 목록 (Enter로 추가, ✕로 삭제)
- **주의**: edit 모드에서 기존 공유 그룹의 항목을 수정하면 해당 그룹을 사용하는 모든 제품에 반영됨

### 파일 구조

```
components/admin/
  TagsPanel.tsx
  SectionsPanel.tsx
  NoticePanel.tsx

app/admin/qr/new/
  page.tsx              ← wizard 진입점 (전체 step state 관리)
  steps/
    Step1Basic.tsx
    Step2Tags.tsx
    Step3Sections.tsx
    Step4Notice.tsx
    Step5Confirm.tsx

app/admin/qr/[id]/edit/
  EditClient.tsx        ← TagsPanel, SectionsPanel, NoticePanel 추가
```

---

## API

### `POST /api/qr` 확장

기존 필드에 아래 추가:

```ts
{
  // 기존
  name: string
  drive_folder_url: string
  subtitle: string | null
  summary: string | null
  idus_url: string | null
  // 추가
  tags: { label: string; sort_order: number }[]
  sections: {
    section_type: SectionType
    title: string | null
    body: string | null
    sort_order: number
    items: { title: string | null; description: string | null; sort_order: number }[]
  }[]
  notice: {
    group_id: string | null          // 기존 그룹 선택 시
    new_group: {                     // 새 그룹 생성 시
      name: string
      items: { content: string; sort_order: number }[]
    } | null
  } | null
}
```

서버 저장 순서: `notice_group` 생성(필요시) → `qr_code` → `product` → `product_tags` → `product_sections` → `product_section_items`

### 수정용 신규 엔드포인트

| 엔드포인트 | 메서드 | 역할 |
|-----------|--------|------|
| `/api/qr/[id]/tags` | POST | 태그 추가 |
| `/api/qr/[id]/tags/[tid]` | DELETE | 태그 삭제 |
| `/api/qr/[id]/sections` | POST | 섹션 추가 |
| `/api/qr/[id]/sections/[sid]` | PATCH / DELETE | 섹션 수정/삭제 |
| `/api/qr/[id]/sections/[sid]/items` | POST | 아이템 추가 |
| `/api/qr/[id]/sections/[sid]/items/[iid]` | PATCH / DELETE | 아이템 수정/삭제 |
| `/api/qr/[id]/notice` | PATCH | notice_group_id 변경 |
| `/api/notice-groups` | GET / POST | 그룹 목록 조회 / 신규 생성 |
| `/api/notice-groups/[gid]/items` | POST | 그룹 항목 추가 |
| `/api/notice-groups/[gid]/items/[iid]` | DELETE | 그룹 항목 삭제 |

---

## 미리보기

wizard 및 edit 페이지 모두 `ProductLandingPage` 컴포넌트를 오른쪽에 고정 표시.
- wizard: 각 단계의 입력이 반영된 `previewProduct` 객체를 실시간으로 생성해 전달
- edit: 기존 구현 유지 (기본 정보 변경만 실시간 반영, 섹션/태그는 저장 후 새로고침 시 반영)
