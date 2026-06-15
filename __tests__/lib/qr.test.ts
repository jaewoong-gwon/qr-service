import { describe, it, expect } from 'vitest'
import { generateSlug } from '@/lib/qr'

describe('generateSlug', () => {
  it('8자리 소문자 hex 문자열을 반환한다', () => {
    const slug = generateSlug()
    expect(slug).toHaveLength(8)
    expect(slug).toMatch(/^[0-9a-f]{8}$/)
  })

  it('호출할 때마다 다른 slug를 반환한다', () => {
    const slugs = new Set(Array.from({ length: 20 }, generateSlug))
    expect(slugs.size).toBeGreaterThan(15)
  })
})
