// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FeatureCardsForm } from '@/components/admin/sections/forms/FeatureCardsForm'

describe('FeatureCardsForm', () => {
  it('renders heading and initial card fields', () => {
    render(<FeatureCardsForm initialContent={{ heading: '특징', cards: [{ icon_drive_id: '', title: '카드1', description: '설명1' }] }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('특징')).toBeInTheDocument()
    expect(screen.getByDisplayValue('카드1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('설명1')).toBeInTheDocument()
  })

  it('adds a new card when + 카드 추가 is clicked', () => {
    render(<FeatureCardsForm initialContent={{ heading: '', cards: [] }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '+ 카드 추가' }))
    expect(screen.getByText('카드 1')).toBeInTheDocument()
  })

  it('calls onSave with heading and cards on submit', () => {
    const onSave = vi.fn()
    render(<FeatureCardsForm initialContent={{ heading: '기능', cards: [{ icon_drive_id: 'id1', title: '제목', description: '설명' }] }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ heading: '기능' }))
  })
})
