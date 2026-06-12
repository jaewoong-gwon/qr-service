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
  purchase_notes: '핸드메이드 제품으로 색상·크기에 차이가 있습니다\n사진과 실물 색상이 다를 수 있습니다\n교환·환불은 아이디어스 정책을 따릅니다',
  keywords: null,
  body: null,
  quote: null,
}

describe('ProductLandingPage', () => {
  it('제품명이 h1으로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByRole('heading', { name: '레진 갓 키링' })).toBeInTheDocument()
  })

  it('description이 있으면 한 줄 소개로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('전통 갓의 아름다움을 담은 레진 키링')).toBeInTheDocument()
  })

  it('purchase_notes가 줄바꿈으로 분리되어 각 항목이 별도로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('구매 전 확인사항')).toBeInTheDocument()
    expect(screen.getByText('핸드메이드 제품으로 색상·크기에 차이가 있습니다')).toBeInTheDocument()
    expect(screen.getByText('사진과 실물 색상이 다를 수 있습니다')).toBeInTheDocument()
    expect(screen.getByText('교환·환불은 아이디어스 정책을 따릅니다')).toBeInTheDocument()
  })

  it('idus_url이 있으면 구매하기 링크와 자세히 보기 링크가 모두 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByRole('link', { name: /아이디어스에서 구매하기/ })).toHaveAttribute(
      'href',
      'https://www.idus.com/v2/product/abc123'
    )
    expect(screen.getByRole('link', { name: /아이디어스에서 자세히 보기/ })).toHaveAttribute(
      'href',
      'https://www.idus.com/v2/product/abc123'
    )
  })

  it('idus_url이 없으면 링크 없고 준비 중 안내가 표시된다', () => {
    render(<ProductLandingPage product={{ ...baseProduct, idus_url: null }} />)
    expect(screen.queryByRole('link', { name: /아이디어스에서 구매하기/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /자세히 보기/ })).not.toBeInTheDocument()
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
