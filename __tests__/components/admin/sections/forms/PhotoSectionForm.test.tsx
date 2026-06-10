// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PhotoSectionForm } from '@/components/admin/sections/forms/PhotoSectionForm'

describe('PhotoSectionForm', () => {
  it('renders image drive URL input', () => {
    render(<PhotoSectionForm initialContent={{ image_drive_id: 'imgId1' }} onSave={vi.fn()} onCancel={vi.fn()} loading={false} error="" />)
    expect(screen.getByDisplayValue('imgId1')).toBeInTheDocument()
  })

  it('calls onSave with image_drive_id on submit', () => {
    const onSave = vi.fn()
    render(<PhotoSectionForm initialContent={{ image_drive_id: 'abc' }} onSave={onSave} onCancel={vi.fn()} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ image_drive_id: 'abc' }))
  })

  it('calls onCancel when 취소 is clicked', () => {
    const onCancel = vi.fn()
    render(<PhotoSectionForm initialContent={{ image_drive_id: '' }} onSave={vi.fn()} onCancel={onCancel} loading={false} error="" />)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
