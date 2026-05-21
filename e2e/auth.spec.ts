// e2e/auth.spec.ts
// Auth cookie is NOT injected here — these tests verify unauthenticated behavior.
import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test('/ redirects to /admin/login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/admin/login')
})

test('wrong credentials show error message', async ({ page }) => {
  await page.goto('/admin/login')
  await page.getByLabel('아이디').fill('admin')
  await page.getByPlaceholder('비밀번호').fill('wrongpassword')
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page.getByText('아이디 또는 비밀번호가 올바르지 않습니다')).toBeVisible()
})
