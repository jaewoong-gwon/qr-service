# Docs & Drive URL Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (PR 1) README와 DB 스키마 문서를 실제 프로젝트 기준으로 재작성하고, (PR 2) Drive 폴더 URL 정규화로 동일 폴더에 대해 항상 동일한 QR slug가 생성되도록 수정한다.

**Architecture:** PR 1은 코드 변경 없는 문서 작업. PR 2는 `lib/drive.ts`에 `parseFolderUrl` 유틸 추가 → `lib/qr.ts`의 `computeSlug`가 전체 URL 대신 폴더 ID를 해시 → API 유효성 검증 강화.

**Tech Stack:** Next.js 16, React 19, Supabase, Tailwind CSS v4, @dnd-kit, Vitest, Playwright, TypeScript

---

## File Map

**PR 1 — 문서화:**
- Modify: `README.md` — 프로젝트 실제 내용으로 재작성
- Create: `docs/database/schema.md` — Supabase 테이블 정의

**PR 2 — Drive URL 정규화:**
- Modify: `lib/drive.ts` — `parseFolderUrl` 추가, `getFolderImages` 내부 리팩터
- Modify: `lib/qr.ts` — `computeSlug`가 폴더 ID를 해시하도록 변경
- Modify: `app/api/qr/route.ts` — 유효성 검증 강화
- Modify: `__tests__/lib/drive.test.ts` — `parseFolderUrl` 테스트 추가
- Modify: `__tests__/lib/qr.test.ts` — slug 멱등성 테스트 추가

---

## PR 1 — 문서화

---

## Task 1: README.md 재작성

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README 재작성**

`README.md` 전체를 아래 내용으로 교체:

> `README.md` 내용 시작 ↓

---

# qr-service

공예 제품에 QR 코드를 연결하는 서비스. 어드민이 QR 코드를 생성하면 고유 슬러그가 부여되고, 스캔 시 제품 상세 페이지로 이동한다.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **DnD:** @dnd-kit/core, @dnd-kit/sortable
- **Unit Tests:** Vitest + React Testing Library
- **E2E Tests:** Playwright
- **Deploy:** Vercel

## Local Setup

```bash
git clone https://github.com/jaewoong-gwon/qr-service.git
cd qr-service
npm install
cp .env.local.example .env.local
# .env.local 값 채우기 (아래 환경 변수 참고)
npm run dev
```

## Environment Variables

| Key | Description |
|-----|-------------|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `GOOGLE_DRIVE_API_KEY` | Google Drive API key (폴더 이미지 조회용) |
| `JWT_SECRET` | 어드민 JWT 서명 키 (최소 32자) |
| `NEXT_PUBLIC_BASE_URL` | 공개 URL (예: `https://example.com`) |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Vercel Preview bypass (CI 전용) |

## Tests

```bash
# 단위 테스트
npm run test:run

# E2E 테스트 (실행 중인 앱 필요)
npm run test:e2e
```

## Pages & Routes

| Route | Description |
|-------|-------------|
| `/admin/login` | 어드민 로그인 |
| `/admin/dashboard` | QR 코드 목록 |
| `/admin/qr/new` | 새 QR 코드 + 제품 생성 |
| `/admin/qr/[id]/sections` | 제품 섹션 관리 (드래그 앤 드롭) |
| `/r/[slug]` | 제품 상세 페이지 (공개) |
| `/api/qr` | QR 코드 CRUD API |
| `/api/products/[id]/sections` | 제품 섹션 CRUD API |

## Database Schema

→ [docs/database/schema.md](docs/database/schema.md)

---

> `README.md` 내용 끝 ↑

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README with actual project info"
```

---

## Task 2: DB 스키마 문서 생성

**Files:**
- Create: `docs/database/schema.md`

- [ ] **Step 1: docs/database/ 디렉터리 생성 후 schema.md 작성**

```bash
mkdir -p docs/database
```

`docs/database/schema.md` 내용:

> `docs/database/schema.md` 내용 시작 ↓

---

# Database Schema

Supabase (PostgreSQL) 기반. 모든 테이블은 `public` 스키마.

---

## qr_codes

QR 코드 엔티티. 슬러그로 제품 페이지와 연결된다.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | 고유 ID |
| `slug` | `text` | UNIQUE, NOT NULL | 8자리 hex (Drive 폴더 ID SHA-256 앞 8자) |
| `drive_folder_url` | `text` | NOT NULL | Google Drive 폴더 URL |
| `created_at` | `timestamptz` | default `now()` | 생성 시각 |

---

## products

QR 코드에 연결된 제품 정보.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | 고유 ID |
| `qr_code_id` | `uuid` | FK → `qr_codes.id`, NOT NULL | 연결된 QR 코드 |
| `name` | `text` | NOT NULL | 제품명 |
| `description` | `text` | nullable | 설명 |
| `price` | `text` | nullable | 가격 (자유 형식, 예: "12,000원") |
| `materials` | `text` | nullable | 소재 |
| `dimensions` | `text` | nullable | 크기 |

---

## product_sections

제품 상세 페이지의 콘텐츠 섹션. `display_order` 기준 정렬.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | 고유 ID |
| `product_id` | `uuid` | FK → `products.id`, NOT NULL | 연결된 제품 |
| `section_type` | `text` | NOT NULL | `hero` \| `text_block` \| `feature_cards` \| `specs` \| `recommend_list` \| `quote` \| `photo_section` |
| `display_order` | `integer` | NOT NULL, default `0` | 노출 순서 (0부터 시작) |
| `content` | `jsonb` | NOT NULL | 섹션 타입별 콘텐츠 (아래 참고) |
| `created_at` | `timestamptz` | default `now()` | 생성 시각 |

### content 스키마 (section_type별)

```jsonc
// hero
{ "title": "string", "subtitle": "string", "body": "string?", "image_drive_id": "string?" }

// text_block
{ "heading": "string", "subheading": "string?", "body": "string", "icon_drive_id": "string?" }

// feature_cards
{ "heading": "string", "cards": [{ "icon_drive_id": "string", "title": "string", "description": "string" }] }

// specs
{ "heading": "string", "items": [{ "image_drive_id": "string", "label": "string" }], "note": "string?" }

// recommend_list
{ "heading": "string", "items": ["string"] }

// quote
{ "text": "string", "attribution": "string?" }

// photo_section
{ "image_drive_id": "string", "heading": "string?", "body": "string?" }
```

---

## admins

어드민 계정. 단일 계정 운영 기준.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | 고유 ID |
| `admin_id` | `text` | UNIQUE, NOT NULL | 로그인 ID |
| `password_hash` | `text` | NOT NULL | bcrypt 해시 |
| `created_at` | `timestamptz` | default `now()` | 생성 시각 |

---

## Relationships

```
qr_codes (1) ──── (1) products
products (1) ──── (N) product_sections
```

---

> `docs/database/schema.md` 내용 끝 ↑

- [ ] **Step 2: Commit**

```bash
git add docs/database/schema.md
git commit -m "docs: add Supabase database schema documentation"
```

---

## PR 2 — Drive URL 정규화

---

## Task 3: `parseFolderUrl` 추가 (TDD)

**Files:**
- Modify: `lib/drive.ts`
- Modify: `__tests__/lib/drive.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가**

`__tests__/lib/drive.test.ts` 파일 끝에 추가:

```ts
import { parseFolderUrl } from '@/lib/drive'

describe('parseFolderUrl', () => {
  it('표준 Drive 폴더 URL에서 폴더 ID를 추출한다', () => {
    expect(parseFolderUrl('https://drive.google.com/drive/folders/abc123XYZ')).toBe('abc123XYZ')
  })

  it('공유 링크 URL에서 폴더 ID를 추출한다 (?usp=sharing)', () => {
    expect(parseFolderUrl('https://drive.google.com/drive/folders/abc123XYZ?usp=sharing')).toBe('abc123XYZ')
  })

  it('trailing slash가 있어도 폴더 ID를 추출한다', () => {
    expect(parseFolderUrl('https://drive.google.com/drive/folders/abc123XYZ/')).toBe('abc123XYZ')
  })

  it('/folders/ 패턴이 없으면 입력값을 그대로 반환한다', () => {
    expect(parseFolderUrl('https://drive.google.com/file/d/abc123/view')).toBe('https://drive.google.com/file/d/abc123/view')
  })

  it('매칭 없는 입력의 공백을 trim한다', () => {
    expect(parseFolderUrl('  rawFolderId  ')).toBe('rawFolderId')
  })
})
```

- [ ] **Step 2: 실패 확인**

```bash
npx vitest run __tests__/lib/drive.test.ts
```

Expected: FAIL — `parseFolderUrl is not exported from '@/lib/drive'`

- [ ] **Step 3: `parseFolderUrl` 구현**

`lib/drive.ts`에서 `parseDriveId` 아래에 추가:

```ts
export function parseFolderUrl(input: string): string {
  const folderMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (folderMatch) return folderMatch[1]
  return input.trim()
}
```

- [ ] **Step 4: 통과 확인**

```bash
npx vitest run __tests__/lib/drive.test.ts
```

Expected: 11 tests pass (기존 6 + 신규 5)

- [ ] **Step 5: Commit**

```bash
git add lib/drive.ts __tests__/lib/drive.test.ts
git commit -m "feat: add parseFolderUrl utility for extracting Google Drive folder IDs"
```

---

## Task 4: `getFolderImages` 리팩터

**Files:**
- Modify: `lib/drive.ts`

`getFolderImages` 내 인라인 정규식 추출 로직을 `parseFolderUrl`로 교체한다.

- [ ] **Step 1: `getFolderImages` 내부 교체**

`lib/drive.ts`의 `getFolderImages` 함수를 수정:

```ts
export async function getFolderImages(folderUrl: string): Promise<DriveImage[]> {
  const folderId = parseFolderUrl(folderUrl)
  if (folderId === folderUrl.trim()) return []

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files` +
      `?q=%27${folderId}%27+in+parents+and+mimeType+contains+%27image/%27` +
      `&fields=files(id,name)` +
      `&key=${process.env.GOOGLE_DRIVE_API_KEY}`,
    { next: { revalidate: 300 } } as RequestInit
  )

  if (!res.ok) return []
  const json = await res.json()
  return json.files ?? []
}
```

- [ ] **Step 2: 기존 테스트 회귀 없음 확인**

```bash
npx vitest run __tests__/lib/drive.test.ts
```

Expected: 11 tests pass (변화 없음)

- [ ] **Step 3: Commit**

```bash
git add lib/drive.ts
git commit -m "refactor: use parseFolderUrl inside getFolderImages"
```

---

## Task 5: `computeSlug` 멱등성 개선 (TDD)

**Files:**
- Modify: `lib/qr.ts`
- Modify: `__tests__/lib/qr.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가**

`__tests__/lib/qr.test.ts` 기존 `describe` 블록 안에 두 테스트 추가:

```ts
it('URL 파라미터가 달라도 동일 폴더면 동일 slug를 반환한다', async () => {
  const slug1 = await computeSlug('https://drive.google.com/drive/folders/abc123XYZ')
  const slug2 = await computeSlug('https://drive.google.com/drive/folders/abc123XYZ?usp=sharing')
  expect(slug1).toBe(slug2)
})

it('trailing slash가 있어도 동일 slug를 반환한다', async () => {
  const slug1 = await computeSlug('https://drive.google.com/drive/folders/abc123XYZ')
  const slug2 = await computeSlug('https://drive.google.com/drive/folders/abc123XYZ/')
  expect(slug1).toBe(slug2)
})
```

- [ ] **Step 2: 실패 확인**

```bash
npx vitest run __tests__/lib/qr.test.ts
```

Expected: 2 FAIL — URL 변형에 대해 다른 slug 반환 (현재 전체 URL 해시)

- [ ] **Step 3: `computeSlug` 수정**

`lib/qr.ts` 전체를 교체:

```ts
import { parseFolderUrl } from './drive'

export async function computeSlug(driveUrl: string): Promise<string> {
  const folderId = parseFolderUrl(driveUrl)
  const data = new TextEncoder().encode(folderId)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hex.slice(0, 8)
}
```

- [ ] **Step 4: 통과 확인**

```bash
npx vitest run __tests__/lib/qr.test.ts
```

Expected: 5 tests pass (기존 3 + 신규 2)

- [ ] **Step 5: Commit**

```bash
git add lib/qr.ts __tests__/lib/qr.test.ts
git commit -m "feat: normalize Drive folder URL before hashing slug"
```

---

## Task 6: API 유효성 검증 강화 + 최종 확인

**Files:**
- Modify: `app/api/qr/route.ts`

현재 검증은 `startsWith('https://drive.google.com/')` 만 체크한다. `/folders/` 패턴 없는 Drive URL(파일 링크 등)도 통과하는 문제를 수정한다.

- [ ] **Step 1: `app/api/qr/route.ts` 업데이트**

파일 상단 import에 추가:
```ts
import { parseFolderUrl } from '@/lib/drive'
```

POST 핸들러에서 기존 유효성 검증 블록을:
```ts
if (!drive_folder_url?.startsWith('https://drive.google.com/')) {
  return NextResponse.json(
    { error: '유효한 Google Drive 링크가 아닙니다' },
    { status: 400 }
  )
}
```

아래로 교체:
```ts
const folderId = parseFolderUrl(drive_folder_url ?? '')
if (
  !drive_folder_url?.startsWith('https://drive.google.com/') ||
  folderId === drive_folder_url.trim()
) {
  return NextResponse.json(
    { error: '유효한 Google Drive 링크가 아닙니다' },
    { status: 400 }
  )
}
```

그리고 기존 `const slug = await computeSlug(drive_folder_url)` 줄은 그대로 유지.

- [ ] **Step 2: 전체 테스트 실행**

```bash
npx vitest run --reporter=dot
```

Expected: all tests pass

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add app/api/qr/route.ts
git commit -m "fix: validate Drive folder URL pattern in QR creation API"
```
