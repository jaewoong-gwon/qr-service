// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TextBlockForm } from '@/components/admin/sections/forms/TextBlockForm'

describe('TextBlockForm', () => {
  it('renders heading and body with initial values', () => {
    render(<TextBlockForm initialContent={{ heading: '제목', body: '본문' }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('제목')).toBeInTheDocument()
    expect(screen.getByDisplayValue('본문')).toBeInTheDocument()
  })

  it('calls onSave with heading and body', () => {
    const onSave = vi.fn()
    render(<TextBlockForm initialContent={{ heading: '', body: '' }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '새 제목' } })
    fireEvent.change(screen.getByRole('textbox', { name: /본문/i }), { target: { value: '내용' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ heading: '새 제목', body: '내용' }))
  })

  it('calls onCancel when 취소 is clicked', () => {
    const onCancel = vi.fn()
    render(<TextBlockForm initialContent={{ heading: '', body: '' }} onSave={vi.fn()} onCancel={onCancel} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
