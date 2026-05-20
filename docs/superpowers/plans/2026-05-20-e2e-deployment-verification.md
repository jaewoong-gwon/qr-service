# E2E 배포 검증 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Playwright E2E 테스트를 작성하고 GitHub Actions에서 Vercel Preview URL 대상으로 자동 실행되도록 설정한다.

**Architecture:** `patrickedqvist/wait-for-vercel-preview` 액션으로 Vercel Preview URL을 수신하고, `BASE_URL` 환경변수로 Playwright에 전달한다. 로컬 실행 시에는 `BASE_URL` 미설정 상태에서 playwright.config의 `webServer`가 Next.js 개발 서버를 자동 구동한다. 테스트 데이터는 결정론적 slug 덕분에 동일 Drive URL 재입력 시 upsert되어 누적 없이 안전하다.

**Tech Stack:** `@playwright/test`, GitHub Actions, `patrickedqvist/wait-for-vercel-preview@v1.3.1`

**Prerequisites (코드 작업 전 수동):**
1. `.env.local`에 실제 Supabase 값 및 `ADMIN_PASSWORD` 입력 (로컬 E2E 실행용)
2. GitHub repository 생성 및 `git remote add origin <url>` 연결
3. Vercel GitHub App 해당 repo 연결
4. GitHub Actions Secrets에 `E2E_ADMIN_PASSWORD` 등록 (배포된 앱의 `ADMIN_PASSWORD`와 동일)

---

## File Map

| 파일 | 역할 |
|------|------|
| `playwright.config.ts` | baseURL, testDir, webServer(로컬 전용) 설정 |
| `e2e/auth.spec.ts` | 인증 플로우 E2E: 리다이렉트, 로그인, 로그아웃 |
| `e2e/qr.spec.ts` | QR 생성·리다이렉트 E2E |
| `.github/workflows/e2e.yml` | Vercel preview 대기 → Playwright 실행 |
| `package.json` | `test:e2e`, `test:e2e:headed` 스크립트 추가 |
| `.gitignore` | Playwright 아티팩트 제외 |

---

## Task 1: Playwright 설치

**Files:**
- Modify: `package.json` (devDependencies)

- [ ] **Step 1: `@playwright/test` 설치**

```bash
npm install --save-dev @playwright/test
```

Expected: `package.json`의 `devDependencies`에 `"@playwright/test": "^1.x.x"` 추가

- [ ] **Step 2: Chromium 브라우저 설치**

```bash
npx playwright install chromium
```

Expected: Chromium 바이너리 다운로드 완료

- [ ] **Step 3: `.gitignore`에 Playwright 아티팩트 추가**

`.gitignore` 파일 하단에 추가:

```
# Playwright
playwright-report/
test-results/
```

---

## Task 2: `playwright.config.ts` 생성

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: config 파일 생성**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  ...(process.env.BASE_URL
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
        },
      }),
})
```

> `BASE_URL`이 설정된 CI 환경에서는 `webServer`를 건너뛰고 외부 Vercel URL을 대상으로 한다. 로컬에서는 `BASE_URL` 미설정 시 `npm run dev`를 자동 구동한다.

- [ ] **Step 2: `package.json` 스크립트 추가**

`package.json`의 `"scripts"` 섹션에 추가:

```json
"test:e2e": "playwright test",
"test:e2e:headed": "playwright test --headed"
```

---

## Task 3: `e2e/auth.spec.ts` 작성

**Files:**
- Create: `e2e/auth.spec.ts`

- [ ] **Step 1: `e2e/` 디렉토리 생성 및 테스트 파일 작성**

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('/ redirects to /admin/login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/admin/login')
})

test('wrong password shows error message', async ({ page }) => {
  await page.goto('/admin/login')
  await page.getByPlaceholder('비밀번호').fill('wrongpassword')
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page.getByText('비밀번호가 올바르지 않습니다')).toBeVisible()
})

test('correct password redirects to dashboard', async ({ page }) => {
  await page.goto('/admin/login')
  await page.getByPlaceholder('비밀번호').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page).toHaveURL('/admin/dashboard')
})

test('logout redirects to login', async ({ page }) => {
  await page.goto('/admin/login')
  await page.getByPlaceholder('비밀번호').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page).toHaveURL('/admin/dashboard')

  await page.getByRole('button', { name: '로그아웃' }).click()
  await expect(page).toHaveURL('/admin/login')
})
```

- [ ] **Step 2: 로컬에서 auth 테스트 실행**

```bash
E2E_ADMIN_PASSWORD=<.env.local의 ADMIN_PASSWORD 값> npx playwright test e2e/auth.spec.ts
```

Expected: 4 tests passed

> 실패 시: dev server가 실행 중인지, `.env.local`에 실제 값이 있는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add e2e/auth.spec.ts
git commit -m "test: add E2E auth flow tests"
```

---

## Task 4: `e2e/qr.spec.ts` 작성

**Files:**
- Create: `e2e/qr.spec.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// e2e/qr.spec.ts
import { test, expect } from '@playwright/test'

const TEST_DRIVE_URL = 'https://drive.google.com/file/d/e2e-fixed-test-slug/view'
const TEST_PRODUCT_NAME = 'E2E Test Product'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.getByPlaceholder('비밀번호').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page).toHaveURL('/admin/dashboard')
}

test('can access /admin/qr/new after login', async ({ page }) => {
  await login(page)
  await page.goto('/admin/qr/new')
  await expect(page.getByRole('heading', { name: '새 QR 코드 생성' })).toBeVisible()
})

test('invalid URL shows error', async ({ page }) => {
  await login(page)
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('Google Drive URL').fill('https://not-drive.com/file')
  await page.getByRole('button', { name: 'QR 생성' }).click()
  await expect(page.getByText('유효한 Google Drive 링크가 아닙니다')).toBeVisible()
})

test('valid Drive URL creates QR SVG', async ({ page }) => {
  await login(page)
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('Google Drive URL').fill(TEST_DRIVE_URL)
  await page.getByRole('button', { name: 'QR 생성' }).click()
  await expect(page.locator('svg').first()).toBeVisible()
})

test('same Drive URL returns same slug (upsert)', async ({ page }) => {
  await login(page)

  const res1 = await page.request.post('/api/qr', {
    data: { product_name: TEST_PRODUCT_NAME, drive_url: TEST_DRIVE_URL },
  })
  const data1 = await res1.json()

  const res2 = await page.request.post('/api/qr', {
    data: { product_name: '다른 제품명', drive_url: TEST_DRIVE_URL },
  })
  const data2 = await res2.json()

  expect(data1.slug).toBe(data2.slug)
  expect(data1.id).toBe(data2.id)
})

test('/r/{slug} returns 302 redirect to Drive URL', async ({ page, request }) => {
  await login(page)

  const createRes = await page.request.post('/api/qr', {
    data: { product_name: TEST_PRODUCT_NAME, drive_url: TEST_DRIVE_URL },
  })
  const { slug } = await createRes.json()

  const redirectRes = await request.get(`/r/${slug}`, { maxRedirects: 0 })
  expect(redirectRes.status()).toBe(302)
  expect(redirectRes.headers()['location']).toBe(TEST_DRIVE_URL)
})
```

- [ ] **Step 2: 로컬에서 qr 테스트 실행**

```bash
E2E_ADMIN_PASSWORD=<.env.local의 ADMIN_PASSWORD 값> npx playwright test e2e/qr.spec.ts
```

Expected: 5 tests passed

> 실패 시: Supabase 연결 확인. `TEST_DRIVE_URL`은 고정값이므로 재실행해도 upsert로 동일 레코드가 반환됨.

- [ ] **Step 3: 전체 E2E 실행 확인**

```bash
E2E_ADMIN_PASSWORD=<.env.local의 ADMIN_PASSWORD 값> npx playwright test
```

Expected: 9 tests passed (auth 4 + qr 5)

- [ ] **Step 4: 커밋**

```bash
git add e2e/qr.spec.ts
git commit -m "test: add E2E QR creation and redirect tests"
```

---

## Task 5: GitHub Actions 워크플로우 생성

**Files:**
- Create: `.github/workflows/e2e.yml`

- [ ] **Step 1: workflows 디렉토리 생성 및 파일 작성**

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: push

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Wait for Vercel Preview
        id: vercel
        uses: patrickedqvist/wait-for-vercel-preview@v1.3.1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          max_timeout: 120

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: ${{ steps.vercel.outputs.url }}
          E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}

      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

> 테스트 실패 시 `playwright-report/`가 GitHub Actions Artifacts에 업로드되어 디버깅에 사용 가능.

- [ ] **Step 2: 커밋**

```bash
git add .github/workflows/e2e.yml playwright.config.ts package.json .gitignore
git commit -m "ci: add Playwright E2E tests with GitHub Actions"
```

---

## Task 6: 최종 검증 및 push

- [ ] **Step 1: 전체 기존 단위 테스트 통과 확인**

```bash
npm run test:run
```

Expected: 9 tests passed (기존 단위 테스트 유지)

- [ ] **Step 2: GitHub에 push**

```bash
git push -u origin feat/initial-implementation
```

Expected: GitHub Actions에서 `E2E Tests` 워크플로우 자동 실행

- [ ] **Step 3: Actions 결과 확인**

GitHub repository → Actions 탭에서 `E2E Tests` 워크플로우 상태 확인.

Expected: 모든 단계 green ✓ (`Wait for Vercel Preview` → `Run E2E tests` → 9 passed)

---

## Self-Review

| 스펙 항목 | 담당 Task |
|-----------|-----------|
| Playwright E2E 설치·설정 | Task 1, 2 ✓ |
| auth: / → /admin/login 리다이렉트 | Task 3 ✓ |
| auth: 잘못된 비밀번호 에러 | Task 3 ✓ |
| auth: 올바른 비밀번호 → dashboard | Task 3 ✓ |
| auth: 로그아웃 → login | Task 3 ✓ |
| qr: /admin/qr/new 접근 가능 | Task 4 ✓ |
| qr: 잘못된 URL 에러 | Task 4 ✓ |
| qr: 유효한 URL → QR SVG | Task 4 ✓ |
| qr: 동일 URL → 동일 slug (upsert) | Task 4 ✓ |
| qr: /r/{slug} → 302 + Location | Task 4 ✓ |
| GitHub Actions 워크플로우 | Task 5 ✓ |
| Vercel preview URL 자동 수신 | Task 5 ✓ |
| 실패 시 report 아티팩트 업로드 | Task 5 ✓ |
