// e2e/qr.spec.ts
import { test, expect } from '@playwright/test'

const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD
if (!ADMIN_PASSWORD) throw new Error('E2E_ADMIN_PASSWORD env var is not set')

const TEST_DRIVE_URL = 'https://drive.google.com/file/d/e2e-fixed-test-slug/view'
const TEST_PRODUCT_NAME = 'E2E Test Product'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.getByPlaceholder('비밀번호').fill(ADMIN_PASSWORD!)
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
  expect(res1.ok()).toBeTruthy()
  const data1 = await res1.json()

  const res2 = await page.request.post('/api/qr', {
    data: { product_name: '다른 제품명', drive_url: TEST_DRIVE_URL },
  })
  expect(res2.ok()).toBeTruthy()
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
