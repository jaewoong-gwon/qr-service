// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SectionCard } from '@/components/sections/SectionCard'
import type { ProductSection } from '@/lib/types'

const meaning: ProductSection = {
  id: 's1',
  section_type: 'meaning',
  title: '갓의 의미',
  body: '조선시대 선비들이 착용하던 전통 모자입니다.',
  sort_order: 0,
}

const closing: ProductSection = {
  id: 's2',
  section_type: 'closing',
  title: null,
  body: '작지만 오래 간직할 수 있는 전통의 가치',
  sort_order: 1,
}

describe('SectionCard', () => {
  it('title과 body를 렌더링한다', () => {
    render(<SectionCard section={meaning} />)
    expect(screen.getByText('갓의 의미')).toBeInTheDocument()
    expect(screen.getByText('조선시대 선비들이 착용하던 전통 모자입니다.')).toBeInTheDocument()
  })

  it('closing 섹션은 text-center로 렌더링된다', () => {
    const { container } = render(<SectionCard section={closing} />)
    expect(container.firstChild).toHaveClass('text-center')
  })

  it('closing 섹션의 body가 표시된다', () => {
    render(<SectionCard section={closing} />)
    expect(screen.getByText('작지만 오래 간직할 수 있는 전통의 가치')).toBeInTheDocument()
  })
})
