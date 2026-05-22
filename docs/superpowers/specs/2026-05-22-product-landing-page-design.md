# Product Landing Page Design

**Goal:** QR 스캔 시 자체 제품 설명 페이지를 보여준다. 제품명·Drive 폴더 사진·설명·가격·소재·크기를 포함한다.

**Architecture:** QR 인프라(`qr_codes`)와 제품 콘텐츠(`products`)를 분리한 두 테이블 구조. `/r/[slug]`는 리다이렉트 대신 Server Component 페이지로 전환하여 두 테이블을 조인해 렌더링한다. 사진은 Google Drive API v3로 서버에서 조회한다.

**Tech Stack:** Next.js 16 App Router, Supabase, Google Drive API v3 (API Key), Tailwind CSS

---

## 1. 데이터 모델

### `qr_codes` 테이블 — QR 인프라 (변경 최소)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK |
| `slug` | text unique | `hash(drive_folder_url)` — 불변 |
| `drive_folder_url` | text | Drive 폴더 URL (기존 `drive_url` 컬럼 rename) |
| `created_at` | timestamptz | |

> `drive_url` 컬럼을 `drive_folder_url`로 rename. 기존 레코드는 마이그레이션으로 처리.

### `products` 테이블 — 제품 콘텐츠 (신규)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK |
| `qr_code_id` | uuid unique | FK → `qr_codes.id` |
| `name` | text | 제품명 |
| `description` | text | 설명 (nullable) |
| `price` | text | 가격 텍스트, 예: "₩15,000" (nullable) |
| `materials` | text | 소재 (nullable) |
| `dimensions` | text | 크기 (nullable) |

```sql
-- Supabase SQL Editor에서 실행
ALTER TABLE qr_codes RENAME COLUMN drive_url TO drive_folder_url;

CREATE TABLE products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id   uuid UNIQUE NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  price        text,
  materials    text,
  dimensions   text
);
```

### TypeScript 타입

```typescript
// lib/types.ts
export interface QrCode {
  id: string
  slug: string
  drive_folder_url: string
  created_at: string
}

export interface Product {
  id: string
  qr_code_id: string
  name: string
  description: string | null
  price: string | null
  materials: string | null
  dimensions: string | null
}
```

---

## 2. Google Drive API 연동

### 환경변수 (서버 전용)
```
GOOGLE_DRIVE_API_KEY=...
```

### `lib/drive.ts`

```typescript
export interface DriveImage {
  id: string
  name: string
  thumbnailLink: string
  webContentLink: string
}

export async function getFolderImages(folderUrl: string): Promise<DriveImage[]> {
  const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/)
  if (!match) return []
  const folderId = match[1]

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files` +
    `?q=%27${folderId}%27+in+parents+and+mimeType+contains+%27image/%27` +
    `&fields=files(id,name,thumbnailLink,webContentLink)` +
    `&key=${process.env.GOOGLE_DRIVE_API_KEY}`,
    { next: { revalidate: 300 } }
  )

  if (!res.ok) return []
  const json = await res.json()
  return json.files ?? []
}
```

**전제 조건:** Drive 폴더는 "링크 있는 모든 사용자" 공개 설정 필요.

---

## 3. 라우트 변경

### 삭제: `app/r/[slug]/route.ts`

### 신규: `app/r/[slug]/page.tsx` (Server Component)

데이터 흐름:
1. slug로 `qr_codes` 조회
2. `products`에서 `qr_code_id` 기준 조회
3. Drive API로 폴더 이미지 목록 조회
4. 없는 slug → `notFound()`
5. Drive 실패 → 이미지 없이 텍스트만 렌더링 (graceful degradation)

---

## 4. 제품 페이지 UI (`components/ProductPageView.tsx`)

```
┌─────────────────────────────┐
│  제품명 (h1)                 │
├─────────────────────────────┤
│  이미지 갤러리               │
│  [ 썸네일 그리드 ]            │
│  클릭 시 원본 이미지 오버레이   │
├─────────────────────────────┤
│  설명                        │
│  ─────────────────           │
│  가격    ₩15,000             │
│  소재    면 100%              │
│  크기    20cm × 15cm         │
│  (null 항목은 행 숨김)         │
└─────────────────────────────┘
```

이미지 없을 경우 → "사진 준비 중입니다" 안내 표시.

---

## 5. 관리자 폼 변경

### `app/admin/qr/new/page.tsx`

- Drive URL 입력 안내 → "Google Drive 폴더 URL"로 변경
- 신규 필드 추가: 제품명, 설명(`<textarea>`), 가격, 소재, 크기

### `app/api/qr/route.ts` (POST)

- `drive_url` → `drive_folder_url`
- `products` 테이블에 제품 정보 저장 (트랜잭션: qr_codes INSERT → products INSERT)

### `app/api/qr/[id]/route.ts` (PATCH)

- `drive_folder_url` 변경 지원
- `products` 필드 수정 지원

---

## 6. 에러 처리

| 상황 | 처리 |
|------|------|
| 없는 slug | `notFound()` → 404 |
| Drive API 실패 | 이미지 없이 텍스트만 표시 |
| 폴더 비공개 | Drive API 빈 배열 → 이미지 없이 표시 |
| products 없는 qr_code | 제품명 없이 "정보 없음" 표시 |

---

## 7. 테스트

### 단위 테스트 (`__tests__/lib/drive.test.ts`)

- 유효한 폴더 URL에서 folder ID 추출 성공
- 잘못된 URL → 빈 배열 반환
- Drive API 실패(fetch error) → 빈 배열 반환

### E2E 업데이트 (`e2e/qr.spec.ts`)

- `/r/{slug}` 302 리다이렉트 테스트 제거
- 신규: `/r/{slug}` 페이지에서 제품명이 표시됨
- 신규: QR 생성 시 제품명, 설명 필드 입력 가능

---

## 8. 수동 설정 (구현 전 필요)

1. Google Cloud Console → 프로젝트 생성 → Google Drive API 활성화
2. API 키 발급 (Drive API로 제한 설정 권장)
3. `.env.local`에 `GOOGLE_DRIVE_API_KEY` 추가
4. Vercel 환경변수에 `GOOGLE_DRIVE_API_KEY` 추가
5. Supabase SQL Editor에서 위 마이그레이션 SQL 실행
