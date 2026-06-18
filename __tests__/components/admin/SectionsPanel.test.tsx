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

  it('meaning type shows 제목 input and 설명 textarea', () => {
    render(<SectionsPanel mode="create" sections={[mockSection]} onChange={() => {}} />)
    expect(screen.getByPlaceholderText('제목을 입력하세요')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('설명을 입력하세요')).toBeInTheDocument()
  })

  it('type selector only shows 추가 설명', () => {
    render(<SectionsPanel mode="create" sections={[mockSection]} onChange={() => {}} />)
    const select = screen.getByRole('combobox')
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.text)
    expect(options).toEqual(['추가 설명'])
  })
})
