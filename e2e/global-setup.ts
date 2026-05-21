import { SignJWT } from 'jose'
import * as fs from 'fs'
import * as path from 'path'

async function globalSetup() {
  const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'
  const { hostname } = new URL(baseURL)

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const token = await new SignJWT({ sub: 'e2e' })
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
}

export default globalSetup
