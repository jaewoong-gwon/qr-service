// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecommendListForm } from '@/components/admin/sections/forms/RecommendListForm'

describe('RecommendListForm', () => {
  it('renders heading and existing items', () => {
    render(<RecommendListForm initialContent={{ heading: '추천', items: ['항목1', '항목2'] }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('추천')).toBeInTheDocument()
    expect(screen.getByDisplayValue('항목1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('항목2')).toBeInTheDocument()
  })

  it('adds a new item when + 항목 추가 is clicked', () => {
    render(<RecommendListForm initialContent={{ heading: '', items: ['첫 항목'] }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '+ 항목 추가' }))
    expect(screen.getAllByRole('textbox').length).toBe(3) // heading + 2 items
  })

  it('calls onSave with heading and filtered items', () => {
    const onSave = vi.fn()
    render(<RecommendListForm initialContent={{ heading: '목록', items: ['A'] }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith({ heading: '목록', items: ['A'] })
  })
})
