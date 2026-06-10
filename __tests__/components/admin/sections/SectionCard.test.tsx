// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionCard } from '@/components/admin/sections/SectionCard'
import type { ProductSection } from '@/lib/types'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

const mockSection: ProductSection = {
  id: 'sec1',
  product_id: 'prod1',
  section_type: 'quote',
  display_order: 0,
  content: { text: '훌륭한 제품' },
}

describe('SectionCard', () => {
  it('renders section type label', () => {
    render(<SectionCard section={mockSection} productId="prod1" isExpanded={false} onToggle={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('인용구')).toBeInTheDocument()
  })

  it('shows form when isExpanded is true', () => {
    render(<SectionCard section={mockSection} productId="prod1" isExpanded={true} onToggle={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByDisplayValue('훌륭한 제품')).toBeInTheDocument()
  })

  it('does not show form when isExpanded is false', () => {
    render(<SectionCard section={mockSection} productId="prod1" isExpanded={false} onToggle={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByDisplayValue('훌륭한 제품')).not.toBeInTheDocument()
  })

  it('calls onToggle when 편집 is clicked', () => {
    const onToggle = vi.fn()
    render(<SectionCard section={mockSection} productId="prod1" isExpanded={false} onToggle={onToggle} onSave={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '편집' }))
    expect(onToggle).toHaveBeenCalled()
  })
})
