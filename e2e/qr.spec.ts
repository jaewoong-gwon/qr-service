// e2e/qr.spec.ts
// Auth cookie is injected via globalSetup (JWT_SECRET) — no login credentials needed.
import { test, expect } from '@playwright/test'

const TEST_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/e2e-test-folder-id'
const TEST_PRODUCT_NAME = 'E2E Test Product'

test('can access /admin/qr/new when authenticated', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByRole('heading', { name: '새 QR 코드 생성' })).toBeVisible()
})

test('QR creation form has product detail fields', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await expect(page.getByLabel('제품명')).toBeVisible()
  await expect(page.getByLabel('Google Drive 폴더 URL')).toBeVisible()
  await expect(page.getByLabel('설명', { exact: false })).toBeVisible()
  await expect(page.getByLabel('가격', { exact: false })).toBeVisible()
  await expect(page.getByLabel('소재', { exact: false })).toBeVisible()
  await expect(page.getByLabel('크기', { exact: false })).toBeVisible()
})

test('invalid URL shows error', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('Google Drive 폴더 URL').fill('https://not-drive.com/file')
  await page.getByRole('button', { name: 'QR 생성' }).click()
  await expect(page.getByText('유효한 Google Drive 링크가 아닙니다')).toBeVisible()
})

test('valid Drive folder URL creates QR SVG', async ({ page }) => {
  await page.goto('/admin/qr/new')
  await page.getByLabel('제품명').fill(TEST_PRODUCT_NAME)
  await page.getByLabel('Google Drive 폴더 URL').fill(TEST_DRIVE_FOLDER_URL)
  await page.getByRole('button', { name: 'QR 생성' }).click()
  await expect(page.locator('svg').first()).toBeVisible()
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

test('/r/{slug} shows product landing page', async ({ page }) => {
  const createRes = await page.request.post('/api/qr', {
    data: { name: TEST_PRODUCT_NAME, drive_folder_url: TEST_DRIVE_FOLDER_URL },
  })
  const { slug } = await createRes.json()

  await page.goto(`/r/${slug}`)
  await expect(page.getByRole('heading', { name: TEST_PRODUCT_NAME })).toBeVisible()
})
