// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuoteSection } from '@/components/product-detail/sections/QuoteSection'
import type { QuoteContent } from '@/lib/types'

describe('QuoteSection', () => {
  it('renders quote text', () => {
    render(<QuoteSection content={{ text: '잘 되길 바라는 마음' }} />)
    expect(screen.getByText('잘 되길 바라는 마음')).toBeInTheDocument()
  })

  it('renders attribution when provided', () => {
    render(<QuoteSection content={{ text: '마음을 전하는 선물', attribution: '작품 이야기' }} />)
    expect(screen.getByText('작품 이야기')).toBeInTheDocument()
  })

  it('renders without attribution', () => {
    render(<QuoteSection content={{ text: '잘 되길 바라는 마음' }} />)
    expect(screen.queryByText('작품 이야기')).toBeNull()
  })
})