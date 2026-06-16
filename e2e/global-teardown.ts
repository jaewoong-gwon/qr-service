import { SignJWT } from 'jose'
import * as fs from 'fs'
import * as path from 'path'

const TEST_PRODUCT_NAME = 'E2E Test Product'
const TEST_STORE_FILE = path.join('e2e', '.auth', 'test-store.json')

async function globalTeardown() {
  const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  // sub는 DB의 admins.admin_id 값과 일치해야 getAdminId()가 동작함
  const token = await new SignJWT({ sub: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret)

  const headers: Record<string, string> = {
    Cookie: `auth_token=${token}`,
  }
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  }

  // 고아 QR 코드 정리
  const listRes = await fetch(`${baseURL}/api/qr`, { headers })
  if (listRes.ok) {
    const items: { id: string; products: { name: string } | null }[] = await listRes.json()
    const orphans = items.filter((item) => item.products?.name === TEST_PRODUCT_NAME)
    await Promise.all(
      orphans.map((item) =>
        fetch(`${baseURL}/api/qr/${item.id}`, { method: 'DELETE', headers })
      )
    )
  }

  // 테스트 매장 정리
  if (fs.existsSync(TEST_STORE_FILE)) {
    const { id: storeId } = JSON.parse(fs.readFileSync(TEST_STORE_FILE, 'utf-8'))
    if (storeId) {
      await fetch(`${baseURL}/api/stores/${storeId}`, { method: 'DELETE', headers })
    }
    fs.unlinkSync(TEST_STORE_FILE)
  }
}

export default globalTeardown
