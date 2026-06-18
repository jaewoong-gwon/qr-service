import { SignJWT } from 'jose'
import * as fs from 'fs'
import * as path from 'path'

const TEST_PRODUCT_NAME = 'E2E Test Product'
const TEST_STORE_NAME = 'E2E Test Store'
const TEST_STORE_FILE = path.join('e2e', '.auth', 'test-store.json')

async function globalTeardown() {
  const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  // sub는 DB의 admins.admin_id 값과 일치해야 getAdminId()가 동작함
  const token = await new SignJWT({ sub: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret)

  const authHeaders: Record<string, string> = {
    Cookie: `auth_token=${token}`,
  }
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    authHeaders['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  }

  // 1. 고아 QR 코드 정리 (CASCADE로 products/tags/sections 함께 삭제)
  const qrListRes = await fetch(`${baseURL}/api/qr`, { headers: authHeaders })
  if (qrListRes.ok) {
    const items: { id: string; products: { name: string } | null }[] = await qrListRes.json()
    const orphans = items.filter((item) => item.products?.name === TEST_PRODUCT_NAME)
    await Promise.all(
      orphans.map(async (item) => {
        const res = await fetch(`${baseURL}/api/qr/${item.id}`, { method: 'DELETE', headers: authHeaders })
        if (!res.ok) console.warn(`[teardown] QR 삭제 실패 (${res.status}): id=${item.id}`)
      })
    )
  } else {
    console.warn(`[teardown] QR 목록 조회 실패 (${qrListRes.status})`)
  }

  // 2. 이번 실행에서 생성한 테스트 매장 삭제 (ID 기반)
  if (fs.existsSync(TEST_STORE_FILE)) {
    const { id: storeId } = JSON.parse(fs.readFileSync(TEST_STORE_FILE, 'utf-8'))
    if (storeId) {
      const res = await fetch(`${baseURL}/api/stores/${storeId}`, { method: 'DELETE', headers: authHeaders })
      if (!res.ok) console.warn(`[teardown] 테스트 매장 삭제 실패 (${res.status}): id=${storeId}`)
    }
    fs.unlinkSync(TEST_STORE_FILE)
  }

  // 3. 이전 실행에서 남은 고아 매장 정리 (이름 기반 — GET /api/stores는 인증 불필요)
  const storeListRes = await fetch(`${baseURL}/api/stores`)
  if (storeListRes.ok) {
    const stores: { id: string; name: string }[] = await storeListRes.json()
    const orphanStores = stores.filter((s) => s.name === TEST_STORE_NAME)
    await Promise.all(
      orphanStores.map(async (s) => {
        const res = await fetch(`${baseURL}/api/stores/${s.id}`, { method: 'DELETE', headers: authHeaders })
        if (!res.ok) console.warn(`[teardown] 고아 매장 삭제 실패 (${res.status}): id=${s.id}`)
      })
    )
  } else {
    console.warn(`[teardown] 매장 목록 조회 실패 (${storeListRes.status})`)
  }
}

export default globalTeardown
