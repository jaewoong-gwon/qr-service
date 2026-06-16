import { SignJWT } from 'jose'

const TEST_PRODUCT_NAME = 'E2E Test Product'

async function globalTeardown() {
  const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const token = await new SignJWT({ sub: 'e2e' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret)

  const headers: Record<string, string> = {
    Cookie: `auth_token=${token}`,
  }
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  }

  const listRes = await fetch(`${baseURL}/api/qr`, { headers })
  if (!listRes.ok) return

  const items: { id: string; products: { name: string } | null }[] = await listRes.json()
  const orphans = items.filter((item) => item.products?.name === TEST_PRODUCT_NAME)

  await Promise.all(
    orphans.map((item) =>
      fetch(`${baseURL}/api/qr/${item.id}`, { method: 'DELETE', headers })
    )
  )
}

export default globalTeardown
