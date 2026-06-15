// e2e/qr.spec.ts
// Auth cookie is injected via globalSetup (JWT_SECRET) — no login credentials needed.
import { test, expect } from '@playwright/test'

const TEST_PRODUCT_NAME = 'E2E Test Product'

test('can access /admin/qr/new when authenticated', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByRole('heading', { name: '새 QR 코드 생성' })).toBeVisible()
})

test('QR creation form has correct fields', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByLabel('제품명')).toBeVisible()
  await expect(page.getByLabel('한 줄 카피', { exact: false })).toBeVisible()
  await expect(page.getByLabel('아이디어스 구매 링크', { exact: false })).toBeVisible()
})

test('creating QR with product name redirects to dashboard', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  // Navigate wizard steps 1→2→3→4→5
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: '다음 →' }).click()
  }
  await page.getByRole('button', { name: '완료 — QR 생성' }).click()
  await expect(page).toHaveURL('/admin/dashboard')
})

test('/r/{slug} shows product name', async ({ page }) => {
  const createRes = await page.request.post('/api/qr', {
    data: { name: TEST_PRODUCT_NAME },
  })
  const { id, slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()

  // Assert purchase button is absent when idus_url is not provided
  await expect(page.getByRole('link', { name: /아이디어스 작품 페이지 보기/ })).toHaveCount(0)

  if (id) {
    await page.request.delete(`/api/qr/${id}`)
  }
})

test('/r/{slug} shows idus purchase button when idus_url is provided', async ({ page }) => {
  const createRes = await page.request.post('/api/qr', {
    data: {
      name: TEST_PRODUCT_NAME,
      idus_url: 'https://www.idus.com/v2/product/e2e-test-id',
    },
  })
  const { id, slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()
  const link = page.getByRole('link', { name: /아이디어스 작품 페이지 보기/ })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', 'https://www.idus.com/v2/product/e2e-test-id')

  if (id) {
    await page.request.delete(`/api/qr/${id}`)
  }
})
