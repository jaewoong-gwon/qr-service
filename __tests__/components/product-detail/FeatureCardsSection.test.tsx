// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeatureCardsSection } from '@/components/product-detail/sections/FeatureCardsSection'
import type { FeatureCardsContent } from '@/lib/types'

const content: FeatureCardsContent = {
  heading: '부담 없이 선택되는 이유',
  cards: [
    { icon_drive_id: 'icon1', title: '국내 손뜨개 제작', description: '수제업 제작' },
    { icon_drive_id: 'icon2', title: '가벼운 무게', description: '부담없는 크기' },
  ],
}

describe('FeatureCardsSection', () => {
  it('renders heading', () => {
    render(<FeatureCardsSection content={content} />)
    expect(screen.getByText('부담 없이 선택되는 이유')).toBeInTheDocument()
  })

  it('renders all card titles and descriptions', () => {
    render(<FeatureCardsSection content={content} />)
    expect(screen.getByText('국내 손뜨개 제작')).toBeInTheDocument()
    expect(screen.getByText('수제업 제작')).toBeInTheDocument()
    expect(screen.getByText('가벼운 무게')).toBeInTheDocument()
    expect(screen.getByText('부담없는 크기')).toBeInTheDocument()
  })

  it('renders card icon images', () => {
    render(<FeatureCardsSection content={content} />)
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(2)
    expect(imgs[0]).toHaveAttribute('src', expect.stringContaining('icon1'))
  })
})