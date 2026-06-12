// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionsPanel } from '@/components/admin/SectionsPanel'
import type { ProductSection } from '@/lib/types'

const mockSection: ProductSection = {
  id: 'tmp-1',
  section_type: 'meaning',
  title: '갓의 의미',
  body: '조선시대...',
  sort_order: 0,
  product_section_items: [],
}

describe('SectionsPanel (create mode)', () => {
  it('renders add button when empty', () => {
    render(<SectionsPanel mode="create" sections={[]} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: '+ 섹션 추가' })).toBeInTheDocument()
  })

  it('renders existing section title input', () => {
    render(<SectionsPanel mode="create" sections={[mockSection]} onChange={() => {}} />)
    expect(screen.getByDisplayValue('갓의 의미')).toBeInTheDocument()
  })

  it('adds a new section when button is clicked', () => {
    const onChange = vi.fn()
    render(<SectionsPanel mode="create" sections={[]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '+ 섹션 추가' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ section_type: 'meaning', title: null, body: null }),
      ])
    )
  })

  it('removes a section when 섹션 삭제 button is clicked', () => {
    const onChange = vi.fn()
    render(<SectionsPanel mode="create" sections={[mockSection]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '섹션 삭제' }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('shows item form for color_meaning type', () => {
    const colorSection: ProductSection = {
      ...mockSection,
      section_type: 'color_meaning',
      product_section_items: [],
    }
    render(<SectionsPanel mode="create" sections={[colorSection]} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: '+ 아이템 추가' })).toBeInTheDocument()
  })
})
