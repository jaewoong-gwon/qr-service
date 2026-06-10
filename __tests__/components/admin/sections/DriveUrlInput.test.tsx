// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DriveUrlInput } from '@/components/admin/sections/DriveUrlInput'

describe('DriveUrlInput', () => {
  it('renders an input with the initial value', () => {
    render(<DriveUrlInput value="abc123" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('abc123')
  })

  it('calls onChange with parsed Drive ID when URL is entered', () => {
    const onChange = vi.fn()
    render(<DriveUrlInput value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://drive.google.com/file/d/xyz789/view' },
    })
    expect(onChange).toHaveBeenCalledWith('xyz789')
  })

  it('shows parsed ID hint when input is a URL', () => {
    render(<DriveUrlInput value="" onChange={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://drive.google.com/file/d/xyz789/view' },
    })
    expect(screen.getByText('파일 ID: xyz789')).toBeInTheDocument()
  })

  it('does not show hint when input is already a raw ID', () => {
    render(<DriveUrlInput value="" onChange={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'rawId123' },
    })
    expect(screen.queryByText(/파일 ID:/)).not.toBeInTheDocument()
  })
})
