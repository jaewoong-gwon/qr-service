# Docs & Drive URL Normalization — Design Spec

**Date:** 2026-06-10
**Branch:** (새 브랜치)
**Scope:** 2개 PR — 문서화 + Drive URL 정규화/QR 중복 개선

---

## Goal

1. 프로젝트 README와 DB 스키마 문서를 실제 코드 기준으로 재작성
2. Drive 폴더 URL을 정규화하여 같은 폴더에 대해 항상 동일한 QR 코드가 생성되도록 보장

---

## PR 1 — 문서화

### README.md

현재: create-next-app 기본 템플릿 (프로젝트와 무관한 내용)
변경: 실제 프로젝트 기준으로 재작성

포함 섹션:
- 프로젝트 개요 (공예 제품 QR 코드 서비스)
- 기술 스택 (Next.js 16, React 19, Supabase, Tailwind v4, @dnd-kit, Vitest, Playwright)
- 로컬 개발 환경 설정
- 필수 환경 변수 목록 (값 없이 키만)
- 테스트 실행 방법 (unit, E2E)
- 배포 정보 (Vercel)

### docs/database/schema.md

현재: 없음
변경: Supabase 테이블 정의 문서 신규 생성

테이블:
- `qr_codes`: id (uuid PK), slug (text unique), drive_folder_url (text), created_at
- `products`: id (uuid PK), qr_code_id (uuid FK → qr_codes.id), name, description, price, materials, dimensions
- `product_sections`: id (uuid PK), product_id (uuid FK → products.id), section_type (text), display_order (int), content (jsonb), created_at
- `admins`: id (uuid PK), admin_id (text unique), password_hash (text), created_at

관계:
- qr_codes 1 → 1 products (qr_code_id)
- products 1 → N product_sections (product_id)

---

## PR 2 — Drive URL 정규화 + QR 중복 개선

### 문제

`computeSlug`가 전체 URL을 해시하기 때문에 동일 폴더의 URL 변형이 다른 슬러그를 만든다:

```
https://drive.google.com/drive/folders/abc123           → slug A
https://drive.google.com/drive/folders/abc123?usp=sharing → slug B (버그)
```

또한 `getFolderImages`에서 폴더 ID 추출 로직이 인라인으로 존재하지만 export되지 않아 재사용 불가.

### 해결

#### `lib/drive.ts` — `parseFolderUrl` 추가

```ts
export function parseFolderUrl(input: string): string {
  const folderMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (folderMatch) return folderMatch[1]
  return input.trim()
}
```

- `/folders/[ID]` 패턴에서 폴더 ID 추출
- 매칭 안 되면 원본 반환 (raw ID 입력 지원)
- `getFolderImages` 내 인라인 추출 로직을 이 함수로 교체

#### `lib/qr.ts` — `computeSlug` 변경

```ts
import { parseFolderUrl } from './drive'

export async function computeSlug(driveUrl: string): Promise<string> {
  const folderId = parseFolderUrl(driveUrl)
  const data = new TextEncoder().encode(folderId)
  // ... SHA-256 해시 (나머지 동일)
}
```

전체 URL 대신 폴더 ID만 해시 → URL 파라미터 무관하게 동일 slug 보장.

#### `app/api/qr/route.ts` — 유효성 검증 강화

현재: `drive_folder_url.startsWith('https://drive.google.com/')`
변경: `parseFolderUrl(drive_folder_url)` 결과가 원본과 다른지 확인

```ts
const folderId = parseFolderUrl(drive_folder_url)
if (!folderId || folderId === drive_folder_url) {
  return NextResponse.json({ error: '유효한 Google Drive 폴더 링크가 아닙니다' }, { status: 400 })
}
```

에러 메시지 동일 유지 → E2E 테스트 영향 없음.

### 변경 파일

| 파일 | 변경 유형 |
|------|-----------|
| `lib/drive.ts` | `parseFolderUrl` 추가, `getFolderImages` 내부 교체 |
| `lib/qr.ts` | `computeSlug`가 폴더 ID 해시하도록 변경 |
| `app/api/qr/route.ts` | 유효성 검증 강화 |
| `__tests__/lib/drive.test.ts` | `parseFolderUrl` 테스트 추가 |
| `__tests__/lib/qr.test.ts` | slug 멱등성 테스트 추가 (신규) |

### 검증

1. `parseFolderUrl` 단위 테스트:
   - `https://drive.google.com/drive/folders/abc123` → `abc123`
   - `https://drive.google.com/drive/folders/abc123?usp=sharing` → `abc123`
   - `https://drive.google.com/drive/folders/abc123/` → `abc123`
   - 원본 반환 케이스

2. `computeSlug` 멱등성 테스트:
   - 같은 폴더 다른 URL → 동일 slug
   - 다른 폴더 → 다른 slug

3. E2E: `same Drive folder URL returns same slug` 기존 테스트 통과 유지

---

## Out of Scope

- Drive API 연동 변경 없음
- 기존 QR 레코드 마이그레이션 없음 (slug 재계산 안 함)
- 폴더 ID 검증 (API 호출로 실제 존재 여부 확인) — 과도한 구현
