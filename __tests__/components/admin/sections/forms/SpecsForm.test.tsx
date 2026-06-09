// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpecsForm } from '@/components/admin/sections/forms/SpecsForm'

describe('SpecsForm', () => {
  it('renders heading and initial items', () => {
    render(<SpecsForm initialContent={{ heading: '스펙', items: [{ image_drive_id: '', label: '레진' }] }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('스펙')).toBeInTheDocument()
    expect(screen.getByDisplayValue('레진')).toBeInTheDocument()
  })

  it('adds a new item when + 항목 추가 is clicked', () => {
    render(<SpecsForm initialContent={{ heading: '', items: [] }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '+ 항목 추가' }))
    expect(screen.getByText('항목 2')).toBeInTheDocument()
  })

  it('calls onSave with content on submit', () => {
    const onSave = vi.fn()
    render(<SpecsForm initialContent={{ heading: '재료', items: [{ image_drive_id: 'id1', label: '레진' }] }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ heading: '재료' }))
  })
})
