// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecommendListSection } from '@/components/product-detail/sections/RecommendListSection'
import type { RecommendListContent } from '@/lib/types'

const content: RecommendListContent = {
  heading: '이런 분들께 추천합니다!',
  items: ['전통적인 의미가 담긴 소품을 좋아하는 분', '집들이 선물을 고민 중인 분'],
}

describe('RecommendListSection', () => {
  it('renders heading', () => {
    render(<RecommendListSection content={content} />)
    expect(screen.getByText('이런 분들께 추천합니다!')).toBeInTheDocument()
  })

  it('renders all items', () => {
    render(<RecommendListSection content={content} />)
    expect(screen.getByText('전통적인 의미가 담긴 소품을 좋아하는 분')).toBeInTheDocument()
    expect(screen.getByText('집들이 선물을 고민 중인 분')).toBeInTheDocument()
  })
})