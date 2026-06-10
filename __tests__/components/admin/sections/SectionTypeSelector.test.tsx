// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionTypeSelector } from '@/components/admin/sections/SectionTypeSelector'

describe('SectionTypeSelector', () => {
  it('renders all 7 section type buttons', () => {
    render(<SectionTypeSelector onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'HERO' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '텍스트 블록' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '피처 카드' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '스펙' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '추천 목록' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '인용구' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '사진' })).toBeInTheDocument()
  })

  it('calls onSelect with the correct type when a button is clicked', () => {
    const onSelect = vi.fn()
    render(<SectionTypeSelector onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: '인용구' }))
    expect(onSelect).toHaveBeenCalledWith('quote')
  })
})
