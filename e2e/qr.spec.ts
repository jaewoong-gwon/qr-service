// e2e/qr.spec.ts
// Auth cookie is injected via globalSetup (JWT_SECRET) — no login credentials needed.
import { test, expect } from '@playwright/test'

const TEST_PRODUCT_NAME = 'E2E Test Product'
const TEST_IDUS_URL = 'https://www.idus.com/v2/product/e2e-test-id'

test('can access /admin/qr/new when authenticated', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByRole('heading', { name: '새 QR 코드 생성' })).toBeVisible()
})

test('QR creation form has correct fields on tab 1', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByLabel('제품명')).toBeVisible()
  await expect(page.getByLabel('한 줄 카피', { exact: false })).toBeVisible()
  await expect(page.getByLabel('아이디어스 구매 링크', { exact: false })).toBeVisible()
})

test('QR 생성 button is disabled without required fields', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByRole('button', { name: 'QR 생성' })).toBeDisabled()
})

test('QR 생성 button activates after filling 제품명 and 아이디어스 링크', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('아이디어스 구매 링크', { exact: false }).fill(TEST_IDUS_URL)
  await expect(page.getByRole('button', { name: 'QR 생성' })).toBeEnabled()
})

test('creating QR shows modal and 홈으로 redirects to dashboard', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('아이디어스 구매 링크', { exact: false }).fill(
    `https://www.idus.com/v2/product/e2e-${Date.now()}`
  )
  await page.getByRole('button', { name: 'QR 생성' }).click()
  await expect(page.getByText('생성되었습니다')).toBeVisible()
  await page.getByRole('button', { name: '홈으로' }).click()
  await expect(page).toHaveURL('/admin/dashboard')
})

test('/r/{slug} shows product name', async ({ page }) => {
  const createRes = await page.request.post('/api/qr', {
    data: { name: TEST_PRODUCT_NAME },
  })
  const { id, slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()
  await expect(page.getByRole('link', { name: /아이디어스 작품 페이지 보기/ })).toHaveCount(0)

  if (id) await page.request.delete(`/api/qr/${id}`)
})

test('/r/{slug} shows idus purchase button when idus_url is provided', async ({ page }) => {
  const createRes = await page.request.post('/api/qr', {
    data: { name: TEST_PRODUCT_NAME, idus_url: TEST_IDUS_URL },
  })
  const { id, slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()
  const link = page.getByRole('link', { name: /아이디어스 작품 페이지 보기/ })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', TEST_IDUS_URL)

  if (id) await page.request.delete(`/api/qr/${id}`)
})
