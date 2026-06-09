// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhotoSection } from '@/components/product-detail/sections/PhotoSection'
import type { PhotoSectionContent } from '@/lib/types'

describe('PhotoSection', () => {
  it('renders image', () => {
    render(<PhotoSection content={{ image_drive_id: 'photo1' }} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('photo1'))
  })

  it('renders heading when provided', () => {
    render(<PhotoSection content={{ image_drive_id: 'photo1', heading: '마음을 전하는 방식' }} />)
    expect(screen.getByText('마음을 전하는 방식')).toBeInTheDocument()
  })

  it('renders body when provided', () => {
    render(<PhotoSection content={{ image_drive_id: 'photo1', body: '설명 텍스트' }} />)
    expect(screen.getByText('설명 텍스트')).toBeInTheDocument()
  })

  it('renders without optional heading and body', () => {
    render(<PhotoSection content={{ image_drive_id: 'photo1' }} />)
    expect(screen.queryByRole('heading')).toBeNull()
  })
})