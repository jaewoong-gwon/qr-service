import { describe, it, expect } from 'vitest'
import { computeSlug } from '@/lib/qr'

describe('computeSlug', () => {
  it('8자리 소문자 hex 문자열을 반환한다', async () => {
    const slug = await computeSlug('https://drive.google.com/file/d/abc/view')
    expect(slug).toHaveLength(8)
    expect(slug).toMatch(/^[0-9a-f]{8}$/)
  })

  it('동일한 URL에 대해 항상 동일한 slug를 반환한다', async () => {
    const url = 'https://drive.google.com/file/d/abc/view'
    expect(await computeSlug(url)).toBe(await computeSlug(url))
  })

  it('다른 URL에 대해 다른 slug를 반환한다', async () => {
    const a = await computeSlug('https://drive.google.com/file/d/aaa/view')
    const b = await computeSlug('https://drive.google.com/file/d/bbb/view')
    expect(a).not.toBe(b)
  })

  it('URL 파라미터가 달라도 동일 폴더면 동일 slug를 반환한다', async () => {
    const slug1 = await computeSlug('https://drive.google.com/drive/folders/abc123XYZ')
    const slug2 = await computeSlug('https://drive.google.com/drive/folders/abc123XYZ?usp=sharing')
    expect(slug1).toBe(slug2)
  })

  it('trailing slash가 있어도 동일 slug를 반환한다', async () => {
    const slug1 = await computeSlug('https://drive.google.com/drive/folders/abc123XYZ')
    const slug2 = await computeSlug('https://drive.google.com/drive/folders/abc123XYZ/')
    expect(slug1).toBe(slug2)
  })
})
