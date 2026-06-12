// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ItemGridCard } from '@/components/sections/ItemGridCard'
import type { ProductSection } from '@/lib/types'

const colorSection: ProductSection = {
  id: 'c1',
  section_type: 'color_meaning',
  title: '오방색의 의미',
  body: null,
  sort_order: 0,
  product_section_items: [
    { title: '청(靑)', description: '성장과 희망을 뜻합니다', sort_order: 0 },
    { title: '황(黃)', description: '중심과 조화의 의미입니다', sort_order: 1 },
  ],
}

describe('ItemGridCard', () => {
  it('섹션 제목이 표시된다', () => {
    render(<ItemGridCard section={colorSection} />)
    expect(screen.getByText('오방색의 의미')).toBeInTheDocument()
  })

  it('각 아이템의 title과 description이 렌더링된다', () => {
    render(<ItemGridCard section={colorSection} />)
    expect(screen.getByText('청(靑)')).toBeInTheDocument()
    expect(screen.getByText('성장과 희망을 뜻합니다')).toBeInTheDocument()
    expect(screen.getByText('황(黃)')).toBeInTheDocument()
  })

  it('items가 없으면 그리드가 비어있다', () => {
    render(<ItemGridCard section={{ ...colorSection, product_section_items: [] }} />)
    expect(screen.getByText('오방색의 의미')).toBeInTheDocument()
    expect(screen.queryByText('청(靑)')).not.toBeInTheDocument()
  })
})
