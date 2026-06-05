// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TextBlockSection } from '@/components/product-detail/sections/TextBlockSection'
import type { TextBlockContent } from '@/lib/types'

const content: TextBlockContent = {
  heading: '왜 명태를 걸어둘까요?',
  body: '명태는 예로부터 큰 생선으로...',
}

describe('TextBlockSection', () => {
  it('renders heading and body', () => {
    render(<TextBlockSection content={content} />)
    expect(screen.getByText('왜 명태를 걸어둘까요?')).toBeInTheDocument()
    expect(screen.getByText('명태는 예로부터 큰 생선으로...')).toBeInTheDocument()
  })

  it('renders subheading when provided', () => {
    render(<TextBlockSection content={{ ...content, subheading: '명태와 장수의 의미' }} />)
    expect(screen.getByText('명태와 장수의 의미')).toBeInTheDocument()
  })

  it('renders icon image when icon_drive_id provided', () => {
    render(<TextBlockSection content={{ ...content, icon_drive_id: 'icon123' }} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('icon123'))
  })

  it('renders without optional fields', () => {
    render(<TextBlockSection content={content} />)
    expect(screen.queryByRole('img')).toBeNull()
  })
})