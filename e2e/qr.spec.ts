// e2e/qr.spec.ts
// Auth cookie is injected via globalSetup (JWT_SECRET) — no login credentials needed.
import { test, expect } from '@playwright/test'

const TEST_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/e2e-test-folder-id'
const TEST_PRODUCT_NAME = 'E2E Test Product'

test('can access /admin/qr/new when authenticated', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByRole('heading', { name: '새 QR 코드 생성' })).toBeVisible()
})

test('QR creation form has correct fields', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByLabel('제품명')).toBeVisible()
  await expect(page.getByLabel('Google Drive 폴더 URL')).toBeVisible()
  await expect(page.getByLabel('작품 소개', { exact: false })).toBeVisible()
  await expect(page.getByLabel('아이디어스 구매 링크', { exact: false })).toBeVisible()
  await expect(page.getByLabel('구매 전 확인사항', { exact: false })).toBeVisible()
})

test('invalid URL shows error', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('Google Drive 폴더 URL').fill('https://not-drive.com/file')
  await page.getByRole('button', { name: 'QR 생성' }).click()
  await expect(page.getByText('유효한 Google Drive 링크가 아닙니다')).toBeVisible()
})

test('valid Drive folder URL creates QR and redirects to sections page', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('Google Drive 폴더 URL').fill(TEST_DRIVE_FOLDER_URL)
  await page.getByRole('button', { name: 'QR 생성' }).click()
  await expect(page).toHaveURL(/\/admin\/qr\/.+\/sections/)
})

test('same Drive folder URL returns same slug', async ({ page }) => {
  const res1 = await page.request.post('/api/qr', {
    data: { name: TEST_PRODUCT_NAME, drive_folder_url: TEST_DRIVE_FOLDER_URL },
  })
  expect(res1.ok()).toBeTruthy()
  const data1 = await res1.json()

  const res2 = await page.request.post('/api/qr', {
    data: { name: '다른 제품명', drive_folder_url: TEST_DRIVE_FOLDER_URL },
  })
  expect(res2.ok()).toBeTruthy()
  const data2 = await res2.json()

  expect(data1.slug).toBe(data2.slug)
  expect(data1.id).toBe(data2.id)
})

test('/r/{slug} shows product name', async ({ page }) => {
  const createRes = await page.request.post('/api/qr', {
    data: { name: TEST_PRODUCT_NAME, drive_folder_url: TEST_DRIVE_FOLDER_URL },
  })
  const { slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()
})

test('/r/{slug} shows idus purchase button when idus_url is provided', async ({ page }) => {
  const createRes = await page.request.post('/api/qr', {
    data: {
      name: TEST_PRODUCT_NAME,
      drive_folder_url: TEST_DRIVE_FOLDER_URL,
      idus_url: 'https://www.idus.com/v2/product/e2e-test-id',
      purchase_notes: 'E2E 테스트 확인사항',
    },
  })
  const { slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()
  const link = page.getByRole('link', { name: /아이디어스에서 구매하기/ })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', 'https://www.idus.com/v2/product/e2e-test-id')
  await expect(page.getByText('E2E 테스트 확인사항')).toBeVisible()
})
