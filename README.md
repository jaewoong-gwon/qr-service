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
