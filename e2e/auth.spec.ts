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
