// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionList } from '@/components/admin/sections/SectionList'
import type { ProductSection } from '@/lib/types'

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn(),
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

const mockSections: ProductSection[] = [
  { id: 's1', product_id: 'p1', section_type: 'quote', display_order: 0, content: { text: '텍스트' } },
  { id: 's2', product_id: 'p1', section_type: 'hero', display_order: 1, content: { title: '제목', subtitle: '부제목' } },
]

describe('SectionList', () => {
  it('renders all section type labels', () => {
    render(<SectionList initialSections={mockSections} productId="p1" />)
    expect(screen.getAllByText('인용구').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('HERO').length).toBeGreaterThanOrEqual(1)
  })

  it('renders "섹션 추가" type selector when no section is being added', () => {
    render(<SectionList initialSections={[]} productId="p1" />)
    expect(screen.getByText('섹션 추가')).toBeInTheDocument()
  })
})
