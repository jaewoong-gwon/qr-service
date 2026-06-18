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

describe('SectionCard', () => {
  it('title과 body를 렌더링한다', () => {
    render(<SectionCard section={meaning} />)
    expect(screen.getByText('갓의 의미')).toBeInTheDocument()
    expect(screen.getByText('조선시대 선비들이 착용하던 전통 모자입니다.')).toBeInTheDocument()
  })

  it('title이 없으면 body만 렌더링된다', () => {
    render(<SectionCard section={{ ...meaning, title: null }} />)
    expect(screen.queryByText('갓의 의미')).not.toBeInTheDocument()
    expect(screen.getByText('조선시대 선비들이 착용하던 전통 모자입니다.')).toBeInTheDocument()
  })
})
