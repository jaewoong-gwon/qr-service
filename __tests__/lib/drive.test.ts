import { describe, it, expect } from 'vitest'
import { parseDriveId, parseFolderUrl } from '@/lib/drive'

describe('parseDriveId', () => {
  it('extracts ID from /file/d/[ID]/view URL', () => {
    expect(parseDriveId('https://drive.google.com/file/d/abc123XYZ/view?usp=sharing')).toBe('abc123XYZ')
  })

  it('extracts ID from ?id= query param URL', () => {
    expect(parseDriveId('https://drive.google.com/open?id=xyz789ABC')).toBe('xyz789ABC')
  })

  it('extracts ID from uc?id= URL', () => {
    expect(parseDriveId('https://drive.google.com/uc?id=def456&export=download')).toBe('def456')
  })

  it('returns raw input when no URL pattern matches', () => {
    expect(parseDriveId('rawFileId_123')).toBe('rawFileId_123')
  })

  it('trims whitespace from raw input', () => {
    expect(parseDriveId('  rawFileId_123  ')).toBe('rawFileId_123')
  })

  it('returns empty string for empty input', () => {
    expect(parseDriveId('')).toBe('')
  })
})

describe('parseFolderUrl', () => {
  it('표준 Drive 폴더 URL에서 폴더 ID를 추출한다', () => {
    expect(parseFolderUrl('https://drive.google.com/drive/folders/abc123XYZ')).toBe('abc123XYZ')
  })

  it('공유 링크 URL에서 폴더 ID를 추출한다 (?usp=sharing)', () => {
    expect(parseFolderUrl('https://drive.google.com/drive/folders/abc123XYZ?usp=sharing')).toBe('abc123XYZ')
  })

  it('trailing slash가 있어도 폴더 ID를 추출한다', () => {
    expect(parseFolderUrl('https://drive.google.com/drive/folders/abc123XYZ/')).toBe('abc123XYZ')
  })

  it('/folders/ 패턴이 없으면 입력값을 그대로 반환한다', () => {
    expect(parseFolderUrl('https://drive.google.com/file/d/abc123/view')).toBe('https://drive.google.com/file/d/abc123/view')
  })

  it('매칭 없는 입력의 공백을 trim한다', () => {
    expect(parseFolderUrl('  rawFolderId  ')).toBe('rawFolderId')
  })
})
