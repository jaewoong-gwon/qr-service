// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpecsSection } from '@/components/product-detail/sections/SpecsSection'
import type { SpecsContent } from '@/lib/types'

const content: SpecsContent = {
  heading: '구매 전 꼭 확인해주세요!',
  items: [
    { image_drive_id: 'img1', label: '13cm 내외' },
  ],
}

describe('SpecsSection', () => {
  it('renders heading', () => {
    render(<SpecsSection content={content} />)
    expect(screen.getByText('구매 전 꼭 확인해주세요!')).toBeInTheDocument()
  })

  it('renders item label and image', () => {
    render(<SpecsSection content={content} />)
    expect(screen.getByText('13cm 내외')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('img1'))
  })

  it('renders note when provided', () => {
    render(<SpecsSection content={{ ...content, note: '약간의 차이가 있을 수 있습니다.' }} />)
    expect(screen.getByText('약간의 차이가 있을 수 있습니다.')).toBeInTheDocument()
  })

  it('renders without note', () => {
    render(<SpecsSection content={content} />)
    expect(screen.queryByText('약간의 차이가 있을 수 있습니다.')).toBeNull()
  })
})