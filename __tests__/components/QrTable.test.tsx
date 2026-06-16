// __tests__/components/QrTable.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QrTable } from '@/components/QrTable'
import type { QrCodeWithProduct } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('react-qr-code', () => ({
  default: () => <svg data-testid="qr-code" />,
}))

const mockItem: QrCodeWithProduct = {
  id: '1',
  slug: 'test-slug',
created_at: '2025-01-01T00:00:00Z',
  products: {
    id: 'p1',
    qr_code_id: '1',
    name: '레진 갓 키링',
    subtitle: null,
    idus_url: null,
    is_active: true,
  },
}

describe('QrTable', () => {
  it('renders empty state when no items', () => {
    render(<QrTable items={[]} />)
    expect(screen.getByText('생성된 QR 코드가 없습니다.')).toBeInTheDocument()
  })

  it('renders product name for each item', () => {
    render(<QrTable items={[mockItem]} />)
    expect(screen.getByText('레진 갓 키링')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<QrTable items={[mockItem]} />)
    expect(screen.getByRole('link', { name: '미리보기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다운로드' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'URL 변경' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '섹션' })).not.toBeInTheDocument()
  })
})
