import { describe, it, expect } from 'vitest'
import { parseDriveId } from '@/lib/drive'

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
