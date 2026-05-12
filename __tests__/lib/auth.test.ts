// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { signJWT, verifyJWT } from '@/lib/auth'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long!!'
})

describe('signJWT', () => {
  it('3개 파트로 구성된 JWT 문자열을 반환한다', async () => {
    const token = await signJWT({ sub: 'admin' })
    expect(token.split('.')).toHaveLength(3)
  })
})

describe('verifyJWT', () => {
  it('유효한 토큰에 대해 true를 반환한다', async () => {
    const token = await signJWT({ sub: 'admin' })
    expect(await verifyJWT(token)).toBe(true)
  })

  it('변조된 토큰에 대해 false를 반환한다', async () => {
    const token = await signJWT({ sub: 'admin' })
    expect(await verifyJWT(token + 'tampered')).toBe(false)
  })

  it('빈 문자열에 대해 false를 반환한다', async () => {
    expect(await verifyJWT('')).toBe(false)
  })
})
