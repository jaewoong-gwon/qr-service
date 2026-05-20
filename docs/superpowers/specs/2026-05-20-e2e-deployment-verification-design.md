# E2E 배포 검증 — Design Spec

**Date:** 2026-05-20
**Status:** Approved

---

## Overview

Vercel Preview 배포 후 실제 환경에서 핵심 플로우(인증, QR 생성, 리다이렉트)가 정상 작동하는지 자동으로 검증한다. Playwright E2E 테스트를 GitHub Actions에서 실행하며, Vercel Preview URL을 대상으로 한다.

---

## Architecture

```
push to GitHub
    │
    ▼
Vercel GitHub App ──▶ Preview 배포 자동 생성
    │                  (프로젝트 환경변수 그대로 사용)
    ▼
GitHub Actions "e2e" job
    │
    ├─ 1. patrickedqvist/wait-for-vercel-preview 로 preview URL 수신
    │       (GitHub Deployments API 사용, GITHUB_TOKEN만 필요)
    │
    ├─ 2. Playwright 설치 후 e2e/ 테스트 실행
    │       BASE_URL = Vercel preview URL
    │       E2E_ADMIN_PASSWORD = GitHub Secret
    │
    └─ 3. 결과를 PR 체크에 표시
```

**트리거:** 모든 브랜치 push  
**대상 환경:** Vercel Preview (프로덕션 미영향)

---

## Test Data Strategy

`computeSlug`는 SHA-256 기반 결정론적 함수이므로 동일한 Drive URL은 항상 동일한 slug를 생성한다. E2E 테스트에서 고정 테스트 URL을 사용하면 재실행 시 API가 기존 레코드를 upsert하여 데이터가 누적되지 않는다. 테스트 전용 Supabase 프로젝트 없이 실 DB를 사용해도 안전하다.

---

## Test Scenarios

### `e2e/auth.spec.ts`

| # | 시나리오 | 검증 항목 |
|---|----------|-----------|
| 1 | `/` 접근 | `/admin/login`으로 리다이렉트 |
| 2 | 잘못된 비밀번호 로그인 | "비밀번호가 올바르지 않습니다" 표시 |
| 3 | 올바른 비밀번호 로그인 | `/admin/dashboard`로 이동 |
| 4 | 로그아웃 | `/admin/login`으로 이동 |

### `e2e/qr.spec.ts`

| # | 시나리오 | 검증 항목 |
|---|----------|-----------|
| 1 | 로그인 후 `/admin/qr/new` 접근 | 페이지 정상 표시 |
| 2 | 잘못된 URL 입력 | 에러 메시지 표시 |
| 3 | 유효한 Drive URL + 제품명 입력 | QR SVG 렌더링 확인 |
| 4 | 동일 URL 재입력 | 동일 slug 반환 (upsert 동작) |
| 5 | `/r/{slug}` 접근 | 302 응답 + Location 헤더 = Drive URL |

**의도적 제외:**
- PNG 다운로드 (브라우저 파일 저장은 E2E에서 안정적 검증 어려움)
- 대시보드 QR 목록 (위 시나리오에서 간접 검증됨)

---

## File Map

| 파일 | 역할 |
|------|------|
| `playwright.config.ts` | Playwright 설정 (baseURL, testDir) |
| `e2e/auth.spec.ts` | 인증 플로우 E2E 테스트 |
| `e2e/qr.spec.ts` | QR 생성·리다이렉트 E2E 테스트 |
| `.github/workflows/e2e.yml` | GitHub Actions 워크플로우 |

---

## Key Configuration

### `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
```

### `.github/workflows/e2e.yml`

```yaml
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
```

---

## GitHub Secrets 설정

| Secret | 값 |
|--------|----|
| `E2E_ADMIN_PASSWORD` | 배포된 앱의 `ADMIN_PASSWORD`와 동일한 값 |

`GITHUB_TOKEN`은 Actions에서 자동 제공되므로 별도 설정 불필요.

---

## package.json 스크립트 추가

```json
"test:e2e": "playwright test",
"test:e2e:headed": "playwright test --headed"
```

---

## Prerequisites (수동)

1. GitHub에 repository 생성 및 remote 연결
2. Vercel GitHub App을 해당 repo에 연결
3. GitHub Actions Secrets에 `E2E_ADMIN_PASSWORD` 등록
