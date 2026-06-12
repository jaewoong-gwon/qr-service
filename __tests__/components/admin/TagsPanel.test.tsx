// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TagsPanel } from '@/components/admin/TagsPanel'
import type { ProductTag } from '@/lib/types'

describe('TagsPanel (create mode)', () => {
  it('renders existing tags as pills', () => {
    const tags: ProductTag[] = [{ label: '한국전통', sort_order: 0 }]
    render(<TagsPanel mode="create" tags={tags} onChange={() => {}} />)
    expect(screen.getByText('한국전통')).toBeInTheDocument()
  })

  it('adds a tag when Enter is pressed', () => {
    const onChange = vi.fn()
    render(<TagsPanel mode="create" tags={[]} onChange={onChange} />)
    const input = screen.getByPlaceholderText('태그 입력 후 Enter')
    fireEvent.change(input, { target: { value: '레진' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith([{ label: '레진', sort_order: 0 }])
  })

  it('adds a tag when 추가 button is clicked', () => {
    const onChange = vi.fn()
    render(<TagsPanel mode="create" tags={[]} onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('태그 입력 후 Enter'), { target: { value: '키링' } })
    fireEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(onChange).toHaveBeenCalledWith([{ label: '키링', sort_order: 0 }])
  })

  it('removes a tag when ✕ is clicked', () => {
    const onChange = vi.fn()
    const tags: ProductTag[] = [{ label: '한국전통', sort_order: 0 }]
    render(<TagsPanel mode="create" tags={tags} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '✕' }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('does not add empty tag', () => {
    const onChange = vi.fn()
    render(<TagsPanel mode="create" tags={[]} onChange={onChange} />)
    fireEvent.keyDown(screen.getByPlaceholderText('태그 입력 후 Enter'), { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
