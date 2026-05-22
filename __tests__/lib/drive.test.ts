// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getFolderImages } from '@/lib/drive'

beforeEach(() => {
  process.env.GOOGLE_DRIVE_API_KEY = 'test-api-key'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getFolderImages', () => {
  it('유효한 폴더 URL에서 이미지 목록을 반환한다', async () => {
    const mockImages = [
      {
        id: 'img1',
        name: 'photo1.jpg',
        thumbnailLink: 'https://thumb1.example.com',
        webContentLink: 'https://content1.example.com',
      },
    ]
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ files: mockImages }),
    })

    const result = await getFolderImages(
      'https://drive.google.com/drive/folders/abc123XYZ'
    )

    expect(result).toEqual(mockImages)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('abc123XYZ'),
      expect.any(Object)
    )
  })

  it('폴더 URL이 아닌 경우 빈 배열을 반환한다', async () => {
    const result = await getFolderImages('https://drive.google.com/file/d/abc/view')
    expect(result).toEqual([])
  })

  it('Drive API 응답이 실패하면 빈 배열을 반환한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false })
    const result = await getFolderImages(
      'https://drive.google.com/drive/folders/abc123'
    )
    expect(result).toEqual([])
  })

  it('files 키가 없는 응답에서 빈 배열을 반환한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
    const result = await getFolderImages(
      'https://drive.google.com/drive/folders/abc123'
    )
    expect(result).toEqual([])
  })
})
