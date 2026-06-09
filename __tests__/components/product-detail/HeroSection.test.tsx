// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroSection } from '@/components/product-detail/sections/HeroSection'
import type { HeroContent } from '@/lib/types'

const content: HeroContent = {
  title: '전통의 의미를 담은 명태',
  subtitle: '액막이 손뜨개',
}

describe('HeroSection', () => {
  it('renders title and subtitle', () => {
    render(<HeroSection content={content} />)
    expect(screen.getByText('전통의 의미를 담은 명태')).toBeInTheDocument()
    expect(screen.getByText('액막이 손뜨개')).toBeInTheDocument()
  })

  it('renders body text when provided', () => {
    render(<HeroSection content={{ ...content, body: '본문 텍스트' }} />)
    expect(screen.getByText('본문 텍스트')).toBeInTheDocument()
  })

  it('renders image when image_drive_id provided', () => {
    render(<HeroSection content={{ ...content, image_drive_id: 'abc123' }} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', expect.stringContaining('abc123'))
  })

  it('renders without optional fields', () => {
    render(<HeroSection content={content} />)
    expect(screen.queryByRole('img')).toBeNull()
  })
})