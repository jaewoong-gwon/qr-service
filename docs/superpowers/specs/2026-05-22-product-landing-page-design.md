# Product Landing Page Implementation Plan

**Goal:** QR 코드 스캔 시 Google Drive로 리다이렉트하는 대신, 제품 설명 페이지(제품명·사진·설명·가격·소재·크기)를 보여준다.

**Architecture:** `/r/[slug]` 라우트를 리다이렉트 핸들러에서 Server Component 페이지로 전환. 제품 정보는 Supabase에서, 사진은 Google Drive API v3로 서버에서 조회해 렌더링한다.

**Tech Stack:** Next.js 16 App Router, Supabase, Google Drive API v3 (API Key), Tailwind CSS

---

## 1. 데이터 모델

### `qr_codes` 테이블 변경

신규 컬럼 추가 (모두 nullable — 기존 레코드 하위 호환):

```sql
ALTER TABLE qr_codes
  ADD COLUMN description TEXT,
  ADD COLUMN price       TEXT,
  ADD COLUMN materials   TEXT,
  ADD COLUMN dimensions  TEXT;
```

`drive_url` 필드는 그대로 유지하되, 값이 Drive **폴더** URL로 바뀐다.  
(`https://drive.google.com/drive/folders/FOLDER_ID`)

### `lib/types.ts` 업데이트

```typescript
export interface QrCode {
  id: string
  slug: string
  drive_url: string       // Drive 폴더 URL
  product_name: string
  description: string | null
  price: string | null
  materials: string | null
  dimensions: string | null
  created_at: string
}
```

---

## 2. Google Drive API 연동

### 환경변수

```
GOOGLE_DRIVE_API_KEY=your_google_drive_api_key
```

서버 전용 (NEXT_PUBLIC 접두사 없음).

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
    `?q='${folderId}'+in+parents+and+mimeType+contains+'image/'` +
    `&fields=files(id,name,thumbnailLink,webContentLink)` +
    `&key=${process.env.GOOGLE_DRIVE_API_KEY}`,
    { next: { revalidate: 300 } }
  )

  if (!res.ok) return []
  const json = await res.json()
  return json.files ?? []
}
```

**전제 조건:** Drive 폴더가 "링크 있는 모든 사용자" 공개 설정이어야 함.

---

## 3. 라우트 변경

### 삭제: `app/r/[slug]/route.ts`

기존 GET 핸들러(302 리다이렉트) 제거.

### 신규: `app/r/[slug]/page.tsx`

```typescript
// Server Component
export default async function ProductPage({ params }) {
  const { slug } = await params
  // 1. Supabase에서 제품 조회
  // 2. 없으면 notFound()
  // 3. Drive API로 이미지 목록 조회
  // 4. ProductPageView 컴포넌트에 데이터 전달
}
```

**에러 처리:**
- slug 없음 → `notFound()` (404)
- Drive API 실패 → 이미지 없이 제품 정보만 표시 (graceful degradation)

---

## 4. 제품 페이지 UI

### `components/ProductPageView.tsx` (Client Component)

구성:
- 상단: 제품명 (h1)
- 이미지 갤러리: 썸네일 그리드, 클릭 시 원본 보기
- 제품 정보 섹션: 설명, 가격, 소재, 크기 (값이 있는 필드만 표시)
- 이미지 없을 경우: "사진 준비 중" 안내 문구

---

## 5. 관리자 폼 변경

### `app/admin/qr/new/page.tsx`

기존 필드(제품명, Drive URL) 유지, 신규 필드 추가:
- 설명 (`<textarea>`)
- 가격 (`<input type="text">`, 예: "₩15,000")
- 소재 (`<input type="text">`)
- 크기 (`<input type="text">`)

Drive URL 입력 안내 문구 변경: "Google Drive 폴더 URL을 입력하세요"

### `app/api/qr/route.ts` (POST)

신규 필드 수신·저장.

### `app/api/qr/[id]/route.ts` (PATCH)

신규 필드 수정 지원.  
`drive_url` 변경 시 기존 검증 (`startsWith('https://drive.google.com/')`) 그대로 유효.

---

## 6. 에러 처리 요약

| 상황 | 처리 |
|------|------|
| 존재하지 않는 slug | `notFound()` → Next.js 404 페이지 |
| Drive API 실패 (quota, 네트워크) | 이미지 없이 텍스트 정보만 표시 |
| 폴더가 비공개인 경우 | Drive API가 빈 배열 반환 → 이미지 없이 표시 |
| 신규 필드가 null인 기존 레코드 | 해당 섹션 숨김 처리 |

---

## 7. 테스트

### 단위 테스트
- `lib/drive.ts`: 유효한 폴더 URL에서 folder ID 추출, 잘못된 URL에서 빈 배열 반환

### E2E 테스트 (`e2e/qr.spec.ts` 업데이트)
- `/r/{slug}` 테스트: 기존 302 리다이렉트 검증 제거
- 신규: 제품 페이지가 제품명을 표시하는지 검증
- 신규: QR 생성 폼에 신규 필드가 있는지 검증

---

## 8. 수동 설정 (구현 전 필요)

1. Google Cloud Console에서 프로젝트 생성
2. Google Drive API 활성화
3. API 키 발급 (Drive API 전용 제한 권장)
4. Vercel 환경변수에 `GOOGLE_DRIVE_API_KEY` 추가
5. Supabase SQL Editor에서 `ALTER TABLE` 실행
