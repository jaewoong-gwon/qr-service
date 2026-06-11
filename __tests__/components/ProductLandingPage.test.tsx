import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import type { Product } from '@/lib/types'

const baseProduct: Product = {
  id: '1',
  qr_code_id: 'qr1',
  name: '레진 갓 키링',
  description: '전통 갓의 아름다움을 담은 레진 키링',
  idus_url: 'https://www.idus.com/v2/product/abc123',
  purchase_notes: '핸드메이드 제품으로 색상·크기에 차이가 있을 수 있습니다.',
}

describe('ProductLandingPage', () => {
  it('제품명이 h1으로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByRole('heading', { name: '레진 갓 키링' })).toBeInTheDocument()
  })

  it('description이 있으면 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('전통 갓의 아름다움을 담은 레진 키링')).toBeInTheDocument()
  })

  it('purchase_notes가 있으면 구매 전 확인사항 섹션이 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('구매 전 확인사항')).toBeInTheDocument()
    expect(screen.getByText(/핸드메이드 제품으로/)).toBeInTheDocument()
  })

  it('idus_url이 있으면 구매 링크가 올바른 href로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    const link = screen.getByRole('link', { name: /아이디어스에서 구매하기/ })
    expect(link).toHaveAttribute('href', 'https://www.idus.com/v2/product/abc123')
  })

  it('idus_url이 없으면 구매 버튼이 없고 준비 중 안내가 표시된다', () => {
    render(<ProductLandingPage product={{ ...baseProduct, idus_url: null }} />)
    expect(screen.queryByRole('link', { name: /아이디어스에서 구매하기/ })).not.toBeInTheDocument()
    expect(screen.getByText('구매 링크 준비 중입니다')).toBeInTheDocument()
  })

  it('purchase_notes가 없으면 구매 전 확인사항 섹션이 없다', () => {
    render(<ProductLandingPage product={{ ...baseProduct, purchase_notes: null }} />)
    expect(screen.queryByText('구매 전 확인사항')).not.toBeInTheDocument()
  })

  it('product가 null이면 기본 문구가 표시된다', () => {
    render(<ProductLandingPage product={null} />)
    expect(screen.getByText('제품 정보 없음')).toBeInTheDocument()
  })
})
