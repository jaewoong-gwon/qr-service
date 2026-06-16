import { SignJWT } from 'jose'
import * as fs from 'fs'
import * as path from 'path'

const TEST_STORE_NAME = 'E2E Test Store'

async function globalSetup() {
  const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'
  const { hostname } = new URL(baseURL)

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  // sub는 DB의 admins.admin_id 값과 일치해야 getAdminId()가 동작함
  const token = await new SignJWT({ sub: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret)

  const authDir = path.join('e2e', '.auth')
  fs.mkdirSync(authDir, { recursive: true })

  fs.writeFileSync(
    path.join(authDir, 'state.json'),
    JSON.stringify({
      cookies: [
        {
          name: 'auth_token',
          value: token,
          domain: hostname,
          path: '/',
          httpOnly: true,
          secure: hostname !== 'localhost',
          sameSite: 'Lax',
          expires: -1,
        },
      ],
      origins: [],
    })
  )

  // 테스트용 매장 생성 (QR 생성 폼의 매장 선택 필드에 사용)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Cookie: `auth_token=${token}`,
  }
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  }

  const res = await fetch(`${baseURL}/api/stores`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: TEST_STORE_NAME }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`테스트 매장 생성 실패 (${res.status}): ${body}`)
  }

  const store = await res.json()
  fs.writeFileSync(
    path.join(authDir, 'test-store.json'),
    JSON.stringify({ id: store.id, name: store.name })
  )
}

export default globalSetup
