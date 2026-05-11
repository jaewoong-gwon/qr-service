# QR Code Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 웹 서비스 — 관리자가 Google Drive URL로 결정론적 QR 코드를 생성하고, 고객이 QR 스캔 시 Drive URL로 리다이렉트된다.

**Architecture:** Next.js App Router 풀스택. `slug = SHA-256(drive_url).hex[:8]`로 동일 URL은 항상 동일 slug 보장. QR은 `{BASE_URL}/r/{slug}` 인코딩. 관리자 보호는 `middleware.ts`에서 HTTP-only JWT 쿠키로 처리.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase (@supabase/supabase-js), react-qr-code, jose (JWT), Tailwind CSS, Vitest + @testing-library/react

---

## File Map

| 파일 | 역할 |
|------|------|
| `lib/types.ts` | 공유 TypeScript 인터페이스 |
| `lib/supabase.ts` | Supabase 서버 클라이언트 팩토리 |
| `lib/qr.ts` | `computeSlug(driveUrl)` |
| `lib/auth.ts` | `signJWT`, `verifyJWT` |
| `middleware.ts` | `/admin/*` 경로 보호 |
| `app/page.tsx` | `/admin/dashboard`로 리다이렉트 |
| `app/layout.tsx` | 루트 HTML 레이아웃 |
| `app/r/[slug]/route.ts` | 공개 리다이렉트 엔드포인트 |
| `app/api/auth/login/route.ts` | POST — JWT 쿠키 발급 |
| `app/api/auth/logout/route.ts` | POST — 쿠키 삭제 |
| `app/api/qr/route.ts` | GET 목록, POST 생성 |
| `app/admin/login/page.tsx` | 로그인 폼 |
| `app/admin/dashboard/page.tsx` | QR 목록 (서버 컴포넌트) |
| `app/admin/qr/new/page.tsx` | QR 생성 폼 |
| `components/QrDisplay.tsx` | QR SVG 렌더링 + PNG 다운로드 |
| `components/QrTable.tsx` | QR 목록 테이블 |
| `components/LogoutButton.tsx` | 클라이언트 로그아웃 버튼 |
| `__tests__/lib/qr.test.ts` | computeSlug 단위 테스트 |
| `__tests__/lib/auth.test.ts` | JWT 헬퍼 단위 테스트 |
| `__tests__/components/QrDisplay.test.tsx` | QrDisplay 컴포넌트 테스트 |

---

## PR-1: 프로젝트 초기화

### Task 1: Next.js 프로젝트 초기화

**Files:** 프로젝트 루트 전체 (create-next-app 생성)

- [ ] **Step 1: create-next-app 실행**

```bash
cd /home/jaeung/projects/qr-service
npx create-next-app@latest . --typescript --eslint --tailwind --app --no-src-dir --import-alias "@/*"
```

프롬프트: Turbopack 여부 → Yes, 나머지 기본값 유지.

Expected: "Success! Created project at /home/jaeung/projects/qr-service"

- [ ] **Step 2: 추가 의존성 설치**

```bash
npm install @supabase/supabase-js react-qr-code jose
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths jsdom
```

- [ ] **Step 3: vitest.config.ts 생성**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

- [ ] **Step 4: vitest.setup.ts 생성**

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: package.json에 test 스크립트 추가**

`package.json`의 `"scripts"` 섹션에 추가:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 6: .env.local.example 생성**

```
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_random_32_char_secret_minimum
NEXT_PUBLIC_BASE_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

- [ ] **Step 7: .env.local 생성 및 실제 값 입력**

```bash
cp .env.local.example .env.local
```

Supabase 프로젝트에서 URL, 키를 복사하여 `.env.local` 채우기.

- [ ] **Step 8: 개발 서버 확인**

```bash
npm run dev
```

Expected: `http://localhost:3000` 에서 기본 Next.js 페이지 표시

- [ ] **Step 9: 커밋**

```bash
git add -A
git commit -m "feat: initialize Next.js project with Vitest"
```

---

## PR-2: 핵심 라이브러리

### Task 2: 타입 & Supabase 클라이언트

**Files:**
- Create: `lib/types.ts`
- Create: `lib/supabase.ts`

- [ ] **Step 1: lib/types.ts 생성**

```typescript
export interface QrCode {
  id: string
  slug: string
  drive_url: string
  product_name: string
  created_at: string
}
```

- [ ] **Step 2: lib/supabase.ts 생성**

```typescript
import { createClient } from '@supabase/supabase-js'
import type { QrCode } from '@/lib/types'

type Database = {
  public: {
    Tables: {
      qr_codes: {
        Row: QrCode
        Insert: Omit<QrCode, 'id' | 'created_at'>
        Update: Partial<Omit<QrCode, 'id' | 'created_at'>>
      }
    }
  }
}

export function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 3: Supabase 테이블 생성**

Supabase Dashboard → SQL Editor에서 실행:

```sql
CREATE TABLE qr_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug varchar(8) UNIQUE NOT NULL,
  drive_url text NOT NULL,
  product_name varchar(255) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

- [ ] **Step 4: 커밋**

```bash
git add lib/types.ts lib/supabase.ts
git commit -m "feat: add types and supabase client"
```

---

### Task 3: Slug 계산 (`computeSlug`)

**Files:**
- Create: `lib/qr.ts`
- Create: `__tests__/lib/qr.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// __tests__/lib/qr.test.ts
import { describe, it, expect } from 'vitest'
import { computeSlug } from '@/lib/qr'

describe('computeSlug', () => {
  it('8자리 소문자 hex 문자열을 반환한다', async () => {
    const slug = await computeSlug('https://drive.google.com/file/d/abc/view')
    expect(slug).toHaveLength(8)
    expect(slug).toMatch(/^[0-9a-f]{8}$/)
  })

  it('동일한 URL에 대해 항상 동일한 slug를 반환한다', async () => {
    const url = 'https://drive.google.com/file/d/abc/view'
    expect(await computeSlug(url)).toBe(await computeSlug(url))
  })

  it('다른 URL에 대해 다른 slug를 반환한다', async () => {
    const a = await computeSlug('https://drive.google.com/file/d/aaa/view')
    const b = await computeSlug('https://drive.google.com/file/d/bbb/view')
    expect(a).not.toBe(b)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- __tests__/lib/qr.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/qr'"

- [ ] **Step 3: computeSlug 구현**

```typescript
// lib/qr.ts
export async function computeSlug(driveUrl: string): Promise<string> {
  const data = new TextEncoder().encode(driveUrl)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hex.slice(0, 8)
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- __tests__/lib/qr.test.ts
```

Expected: PASS — 3 tests passed

- [ ] **Step 5: 커밋**

```bash
git add lib/qr.ts __tests__/lib/qr.test.ts
git commit -m "feat: add deterministic slug computation with tests"
```

---

### Task 4: JWT 인증 헬퍼

**Files:**
- Create: `lib/auth.ts`
- Create: `__tests__/lib/auth.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// __tests__/lib/auth.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { signJWT, verifyJWT } from '@/lib/auth'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long!!'
})

describe('signJWT', () => {
  it('3개 파트로 구성된 JWT 문자열을 반환한다', async () => {
    const token = await signJWT({ sub: 'admin' })
    expect(token.split('.')).toHaveLength(3)
  })
})

describe('verifyJWT', () => {
  it('유효한 토큰에 대해 true를 반환한다', async () => {
    const token = await signJWT({ sub: 'admin' })
    expect(await verifyJWT(token)).toBe(true)
  })

  it('변조된 토큰에 대해 false를 반환한다', async () => {
    const token = await signJWT({ sub: 'admin' })
    expect(await verifyJWT(token + 'tampered')).toBe(false)
  })

  it('빈 문자열에 대해 false를 반환한다', async () => {
    expect(await verifyJWT('')).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- __tests__/lib/auth.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/auth'"

- [ ] **Step 3: auth 헬퍼 구현**

```typescript
// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!)
}

export async function signJWT(payload: { sub: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(getSecret())
}

export async function verifyJWT(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- __tests__/lib/auth.test.ts
```

Expected: PASS — 4 tests passed

- [ ] **Step 5: 커밋**

```bash
git add lib/auth.ts __tests__/lib/auth.test.ts
git commit -m "feat: add JWT auth helpers with tests"
```

---

## PR-3: 리다이렉트 엔드포인트

### Task 5: `/r/[slug]` 라우트

**Files:**
- Create: `app/r/[slug]/route.ts`

- [ ] **Step 1: 리다이렉트 라우트 생성**

```typescript
// app/r/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createServerSupabaseClient()

  const { data } = await supabase
    .from('qr_codes')
    .select('drive_url')
    .eq('slug', slug)
    .single()

  if (!data) {
    return new NextResponse('유효하지 않은 QR 코드입니다', { status: 404 })
  }

  return NextResponse.redirect(data.drive_url, { status: 302 })
}
```

- [ ] **Step 2: 수동 테스트**

개발 서버 실행 중, Supabase SQL Editor에서 테스트 행 삽입:

```sql
INSERT INTO qr_codes (slug, drive_url, product_name)
VALUES ('test1234', 'https://drive.google.com/file/d/test/view', 'Test Product');
```

- `http://localhost:3000/r/test1234` → Drive URL로 리다이렉트 확인
- `http://localhost:3000/r/notfound` → 404 텍스트 확인

- [ ] **Step 3: 커밋**

```bash
git add app/r/
git commit -m "feat: add public redirect endpoint /r/[slug]"
```

---

## PR-4: 인증 시스템

### Task 6: 로그인 API 라우트

**Files:**
- Create: `app/api/auth/login/route.ts`

- [ ] **Step 1: 로그인 라우트 생성**

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { signJWT } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: '비밀번호가 올바르지 않습니다' },
      { status: 401 }
    )
  }

  const token = await signJWT({ sub: 'admin' })
  const response = NextResponse.json({ success: true })

  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return response
}
```

- [ ] **Step 2: curl로 수동 테스트**

```bash
# 잘못된 비밀번호
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}' | jq
# Expected: {"error":"비밀번호가 올바르지 않습니다"}

# 올바른 비밀번호 (.env.local의 ADMIN_PASSWORD 값으로 교체)
curl -sv -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"YOUR_PASSWORD"}' 2>&1 | grep -E 'Set-Cookie|success'
# Expected: Set-Cookie: auth_token=... 헤더 및 {"success":true}
```

- [ ] **Step 3: 커밋**

```bash
git add app/api/auth/login/
git commit -m "feat: add login API route"
```

---

### Task 7: 로그아웃 API 라우트

**Files:**
- Create: `app/api/auth/logout/route.ts`

- [ ] **Step 1: 로그아웃 라우트 생성**

```typescript
// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  })
  return response
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/api/auth/logout/
git commit -m "feat: add logout API route"
```

---

### Task 8: 미들웨어

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: 미들웨어 생성**

```typescript
// middleware.ts (프로젝트 루트)
import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  if (!token || !(await verifyJWT(token))) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/dashboard',
    '/admin/qr/:path*',
    '/api/auth/logout',
    '/api/qr/:path*',
  ],
}
```

- [ ] **Step 2: 수동 테스트**

1. 로그인 없이 `http://localhost:3000/admin/dashboard` 접근 → `/admin/login`으로 리다이렉트 확인
2. 로그인 후 `http://localhost:3000/admin/dashboard` 접근 → 리다이렉트 없음 확인 (페이지 없어도 404 OK)

- [ ] **Step 3: 커밋**

```bash
git add middleware.ts
git commit -m "feat: add auth middleware protecting /admin/* routes"
```

---

## PR-5: QR 관리 API

### Task 9: QR API 라우트

**Files:**
- Create: `app/api/qr/route.ts`

- [ ] **Step 1: QR API 라우트 생성**

```typescript
// app/api/qr/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { computeSlug } from '@/lib/qr'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { drive_url, product_name } = body

  if (!drive_url?.startsWith('https://drive.google.com/')) {
    return NextResponse.json(
      { error: '유효한 Google Drive 링크가 아닙니다' },
      { status: 400 }
    )
  }

  if (!product_name?.trim()) {
    return NextResponse.json({ error: '제품명을 입력해주세요' }, { status: 400 })
  }

  const slug = await computeSlug(drive_url)
  const supabase = createServerSupabaseClient()

  const { data: existing } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json(existing, { status: 200 })
  }

  const { data, error } = await supabase
    .from('qr_codes')
    .insert({ slug, drive_url, product_name: product_name.trim() })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: curl로 수동 테스트**

```bash
# 쿠키 저장하며 로그인
curl -sc /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"YOUR_PASSWORD"}'

# QR 생성
curl -sb /tmp/cookies.txt -X POST http://localhost:3000/api/qr \
  -H "Content-Type: application/json" \
  -d '{"drive_url":"https://drive.google.com/file/d/abc123/view","product_name":"제품 A"}' | jq
# Expected: {"id":"...","slug":"XXXXXXXX","drive_url":"...","product_name":"제품 A","created_at":"..."}

# 동일 URL 재입력 → 동일 slug 반환 확인
curl -sb /tmp/cookies.txt -X POST http://localhost:3000/api/qr \
  -H "Content-Type: application/json" \
  -d '{"drive_url":"https://drive.google.com/file/d/abc123/view","product_name":"다른 이름"}' | jq
# Expected: 동일한 slug 값

# 목록 조회
curl -sb /tmp/cookies.txt http://localhost:3000/api/qr | jq
# Expected: 생성한 항목 포함 배열
```

- [ ] **Step 3: 커밋**

```bash
git add app/api/qr/
git commit -m "feat: add QR management API (GET list, POST create)"
```

---

## PR-6: 관리자 로그인 UI

### Task 10: 로그인 페이지

**Files:**
- Create: `app/admin/login/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: app/layout.tsx 업데이트**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QR Code Manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: app/page.tsx — 루트 리다이렉트**

```tsx
// app/page.tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/admin/dashboard')
}
```

- [ ] **Step 3: 로그인 페이지 생성**

```tsx
// app/admin/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin/dashboard')
    } else {
      const data = await res.json()
      setError(data.error)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow w-80 flex flex-col gap-4"
      >
        <h1 className="text-xl font-bold text-center">QR Code Manager</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          autoFocus
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: 수동 테스트**

1. `http://localhost:3000/` → `/admin/login`으로 리다이렉트 확인
2. 잘못된 비밀번호 입력 → "비밀번호가 올바르지 않습니다" 표시
3. 올바른 비밀번호 입력 → `/admin/dashboard`로 리다이렉트

- [ ] **Step 5: 커밋**

```bash
git add app/admin/login/ app/page.tsx app/layout.tsx
git commit -m "feat: add admin login page"
```

---

## PR-7: QR 생성 UI

### Task 11: QrDisplay 컴포넌트

**Files:**
- Create: `components/QrDisplay.tsx`
- Create: `__tests__/components/QrDisplay.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// __tests__/components/QrDisplay.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QrDisplay } from '@/components/QrDisplay'

describe('QrDisplay', () => {
  it('PNG 다운로드 버튼을 렌더링한다', () => {
    render(<QrDisplay slug="abc12345" productName="제품 A" />)
    expect(screen.getByRole('button', { name: /PNG 다운로드/ })).toBeInTheDocument()
  })

  it('SVG QR 코드를 렌더링한다', () => {
    const { container } = render(<QrDisplay slug="abc12345" productName="제품 A" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm run test:run -- __tests__/components/QrDisplay.test.tsx
```

Expected: FAIL — "Cannot find module '@/components/QrDisplay'"

- [ ] **Step 3: QrDisplay 컴포넌트 생성**

```tsx
// components/QrDisplay.tsx
'use client'

import { useRef } from 'react'
import QRCode from 'react-qr-code'

interface QrDisplayProps {
  slug: string
  productName: string
}

export function QrDisplay({ slug, productName }: QrDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const qrValue = `${process.env.NEXT_PUBLIC_BASE_URL}/r/${slug}`

  const handleDownload = () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const size = 256

    canvas.width = size
    canvas.height = size

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${productName}-qr.png`
      link.click()
    }
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-white">
      <div ref={containerRef}>
        <QRCode value={qrValue} size={200} />
      </div>
      <button
        onClick={handleDownload}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        PNG 다운로드
      </button>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm run test:run -- __tests__/components/QrDisplay.test.tsx
```

Expected: PASS — 2 tests passed

- [ ] **Step 5: 커밋**

```bash
git add components/QrDisplay.tsx __tests__/components/QrDisplay.test.tsx
git commit -m "feat: add QrDisplay component with PNG download"
```

---

### Task 12: QR 생성 페이지

**Files:**
- Create: `app/admin/qr/new/page.tsx`

- [ ] **Step 1: QR 생성 페이지 생성**

```tsx
// app/admin/qr/new/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { QrDisplay } from '@/components/QrDisplay'
import type { QrCode } from '@/lib/types'

export default function NewQrPage() {
  const [productName, setProductName] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [result, setResult] = useState<QrCode | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_name: productName, drive_url: driveUrl }),
    })

    const data = await res.json()
    if (res.ok) {
      setResult(data)
    } else {
      setError(data.error)
    }
    setLoading(false)
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <Link href="/admin/dashboard" className="text-blue-600 hover:underline text-sm">
        ← 목록으로
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">새 QR 코드 생성</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">제품명</label>
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Google Drive URL</label>
          <input
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '생성 중...' : 'QR 생성'}
        </button>
      </form>

      {result && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">생성된 QR 코드</h2>
          <QrDisplay slug={result.slug} productName={result.product_name} />
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: 수동 테스트**

1. 로그인 후 `http://localhost:3000/admin/qr/new` 접근
2. 제품명 + 유효한 Drive URL 입력 → QR 코드 표시 확인
3. "PNG 다운로드" 클릭 → PNG 파일 다운로드 확인
4. 잘못된 URL (drive.google.com 아님) 입력 → 에러 메시지 확인
5. 동일한 Drive URL 재입력 → 동일한 QR 코드 확인

- [ ] **Step 3: 커밋**

```bash
git add app/admin/qr/
git commit -m "feat: add QR creation page"
```

---

## PR-8: QR 목록 UI

### Task 13: 공유 컴포넌트

**Files:**
- Create: `components/LogoutButton.tsx`
- Create: `components/QrTable.tsx`

- [ ] **Step 1: LogoutButton 생성**

```tsx
// components/LogoutButton.tsx
'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1 text-sm border rounded hover:bg-gray-100 transition-colors"
    >
      로그아웃
    </button>
  )
}
```

- [ ] **Step 2: QrTable 생성**

```tsx
// components/QrTable.tsx
'use client'

import QRCode from 'react-qr-code'
import type { QrCode } from '@/lib/types'

interface QrTableProps {
  items: QrCode[]
}

export function QrTable({ items }: QrTableProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  if (items.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        생성된 QR 코드가 없습니다.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3 font-medium">제품명</th>
            <th className="text-left p-3 font-medium">Slug</th>
            <th className="text-left p-3 font-medium">생성일</th>
            <th className="text-left p-3 font-medium">QR</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{item.product_name}</td>
              <td className="p-3 font-mono">{item.slug}</td>
              <td className="p-3 text-gray-500">
                {new Date(item.created_at).toLocaleDateString('ko-KR')}
              </td>
              <td className="p-3">
                <QRCode value={`${baseUrl}/r/${item.slug}`} size={64} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add components/LogoutButton.tsx components/QrTable.tsx
git commit -m "feat: add LogoutButton and QrTable components"
```

---

### Task 14: 대시보드 페이지

**Files:**
- Create: `app/admin/dashboard/page.tsx`

- [ ] **Step 1: 대시보드 페이지 생성**

```tsx
// app/admin/dashboard/page.tsx
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { QrTable } from '@/components/QrTable'
import { LogoutButton } from '@/components/LogoutButton'
import type { QrCode } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">QR Code Manager</h1>
        <div className="flex gap-3 items-center">
          <Link
            href="/admin/qr/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            + 새 QR 생성
          </Link>
          <LogoutButton />
        </div>
      </div>
      <QrTable items={(data as QrCode[]) ?? []} />
    </main>
  )
}
```

- [ ] **Step 2: 전체 테스트 실행**

```bash
npm run test:run
```

Expected: 전체 테스트 통과 (qr.test.ts 3개, auth.test.ts 4개, QrDisplay.test.tsx 2개)

- [ ] **Step 3: 엔드 투 엔드 수동 테스트**

1. `http://localhost:3000` → `/admin/login` 리다이렉트
2. 로그인 → `/admin/dashboard` 이동, 목록 표시
3. "+ 새 QR 생성" 클릭 → `/admin/qr/new`
4. 제품명 + Drive URL 입력 → QR 생성 + PNG 다운로드
5. "← 목록으로" → 대시보드에 새 항목 및 QR 썸네일 표시
6. "로그아웃" → `/admin/login` 리다이렉트
7. `http://localhost:3000/r/{slug}` → Drive URL로 리다이렉트

- [ ] **Step 4: 커밋**

```bash
git add app/admin/dashboard/
git commit -m "feat: add admin dashboard with QR list"
```

---

## Self-Review

| 항목 | 상태 |
|------|------|
| 리다이렉트 엔드포인트 `/r/[slug]` | Task 5 ✓ |
| 로그인/로그아웃 API | Task 6, 7 ✓ |
| 미들웨어 보호 | Task 8 ✓ |
| QR 생성 API (결정론적 slug) | Task 9 ✓ |
| QR 목록 API | Task 9 ✓ |
| 로그인 UI | Task 10 ✓ |
| QR 생성 UI | Task 11, 12 ✓ |
| QR 목록 UI | Task 13, 14 ✓ |
| `computeSlug` 시그니처 일관성 | `async (driveUrl: string) => Promise<string>` 전체 동일 ✓ |
| `verifyJWT` 시그니처 일관성 | `async (token: string) => Promise<boolean>` 전체 동일 ✓ |
| `QrCode` 타입 일관성 | `lib/types.ts` 정의, 전체 참조 ✓ |
| TBD/TODO 없음 | ✓ |
