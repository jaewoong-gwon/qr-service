// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HeroForm } from '@/components/admin/sections/forms/HeroForm'
import type { HeroContent } from '@/lib/types'

const initial: HeroContent = { title: '제목', subtitle: '부제목' }

describe('HeroForm', () => {
  it('renders title and subtitle with initial values', () => {
    render(<HeroForm initialContent={initial} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('제목')).toBeInTheDocument()
    expect(screen.getByDisplayValue('부제목')).toBeInTheDocument()
  })

  it('calls onSave with title and subtitle', () => {
    const onSave = vi.fn()
    render(<HeroForm initialContent={{ title: '', subtitle: '' }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '신제품' } })
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '부제목입니다' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: '신제품', subtitle: '부제목입니다' }))
  })

  it('calls onCancel when 취소 is clicked', () => {
    const onCancel = vi.fn()
    render(<HeroForm initialContent={initial} onSave={vi.fn()} onCancel={onCancel} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
