// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuoteForm } from '@/components/admin/sections/forms/QuoteForm'
import type { QuoteContent } from '@/lib/types'

const initial: QuoteContent = { text: '좋은 제품', attribution: '홍길동' }

describe('QuoteForm', () => {
  it('renders text and attribution fields with initial values', () => {
    render(<QuoteForm initialContent={initial} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('좋은 제품')).toBeInTheDocument()
    expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument()
  })

  it('calls onSave with form content on submit', () => {
    const onSave = vi.fn()
    render(<QuoteForm initialContent={{ text: '' }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.change(screen.getByRole('textbox', { name: /인용 텍스트/i }), {
      target: { value: '훌륭한 제품입니다' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ text: '훌륭한 제품입니다' }))
  })

  it('calls onCancel when 취소 is clicked', () => {
    const onCancel = vi.fn()
    render(<QuoteForm initialContent={{ text: '' }} onSave={vi.fn()} onCancel={onCancel} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('disables save button when loading', () => {
    render(<QuoteForm initialContent={{ text: '' }} onSave={vi.fn()} onCancel={vi.fn()} loading={true} error="" />)
    expect(screen.getByRole('button', { name: '저장 중...' })).toBeDisabled()
  })

  it('shows error message when error prop is set', () => {
    render(<QuoteForm initialContent={{ text: '' }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="저장 실패" />)
    expect(screen.getByText('저장 실패')).toBeInTheDocument()
  })
})
