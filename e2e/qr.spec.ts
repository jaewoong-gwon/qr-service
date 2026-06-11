// e2e/qr.spec.ts
// Auth cookie is injected via globalSetup (JWT_SECRET) — no login credentials needed.
import { test, expect } from '@playwright/test'

const TEST_PRODUCT_NAME = 'E2E Test Product'

// Read-only tests share a static URL (no DB writes).
const STATIC_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/e2e-test-folder-id'

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

test('valid Drive folder URL creates QR and redirects to dashboard', async ({ page }) => {
  const uniqueUrl = `https://drive.google.com/drive/folders/e2e-new-${Date.now()}`

  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('Google Drive 폴더 URL').fill(uniqueUrl)
  await page.getByRole('button', { name: 'QR 생성' }).click()
  await expect(page).toHaveURL('/admin/dashboard')
})

test('same Drive folder URL returns same slug', async ({ page }) => {
  const uniqueUrl = `https://drive.google.com/drive/folders/e2e-slug-${Date.now()}`
  let createdId: string | undefined

  const res1 = await page.request.post('/api/qr', {
    data: { name: TEST_PRODUCT_NAME, drive_folder_url: uniqueUrl },
  })
  expect(res1.ok()).toBeTruthy()
  const data1 = await res1.json()
  createdId = data1.id

  const res2 = await page.request.post('/api/qr', {
    data: { name: '다른 제품명', drive_folder_url: uniqueUrl },
  })
  expect(res2.ok()).toBeTruthy()
  const data2 = await res2.json()

  expect(data1.slug).toBe(data2.slug)
  expect(data1.id).toBe(data2.id)

  if (createdId) {
    await page.request.delete(`/api/qr/${createdId}`)
  }
})

test('/r/{slug} shows product name', async ({ page }) => {
  const uniqueUrl = `https://drive.google.com/drive/folders/e2e-name-${Date.now()}`

  const createRes = await page.request.post('/api/qr', {
    data: { name: TEST_PRODUCT_NAME, drive_folder_url: uniqueUrl },
  })
  const { id, slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()

  // Assert purchase button is absent when idus_url is not provided
  await expect(page.getByRole('link', { name: /아이디어스에서 구매하기/ })).toHaveCount(0)

  if (id) {
    await page.request.delete(`/api/qr/${id}`)
  }
})

test('/r/{slug} shows idus purchase button when idus_url is provided', async ({ page }) => {
  const uniqueUrl = `https://drive.google.com/drive/folders/e2e-idus-${Date.now()}`

  const createRes = await page.request.post('/api/qr', {
    data: {
      name: TEST_PRODUCT_NAME,
      drive_folder_url: uniqueUrl,
      idus_url: 'https://www.idus.com/v2/product/e2e-test-id',
      purchase_notes: 'E2E 테스트 확인사항',
    },
  })
  const { id, slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()
  const link = page.getByRole('link', { name: /아이디어스에서 구매하기/ })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', 'https://www.idus.com/v2/product/e2e-test-id')
  await expect(page.getByText('E2E 테스트 확인사항')).toBeVisible()

  if (id) {
    await page.request.delete(`/api/qr/${id}`)
  }
})
