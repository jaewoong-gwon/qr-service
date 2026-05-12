import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QrDisplay } from '@/components/QrDisplay'

describe('QrDisplay', () => {
  it('PNG 다운로드 버튼을 렌더링한다', () => {
    render(<QrDisplay slug="abc12345" productName="제품 A" />)
    expect(screen.getByRole('button', { name: /PNG 다운로드/ })).toBeInTheDocument()
  })

  it('SVG QR 코드를 렌더링한다', () => {
    const { container } = render(<QrDisplay slug="abc12345" productName="제품 A" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
