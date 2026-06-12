import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import type { Product } from '@/lib/types'

const baseProduct: Product = {
  id: '1',
  qr_code_id: 'qr1',
  name: '레진 갓 키링',
  description: '전통의 아름다움을 일상 속에',
  idus_url: 'https://www.idus.com/v2/product/abc123',
  purchase_notes: '핸드메이드 제품으로 색상·크기에 차이가 있습니다\n사진과 실물 색상이 다를 수 있습니다',
  keywords: '전통 소품,핸드메이드,선물 추천',
  body: '한국 전통 갓의 우아한 선과 품격을 작은 키링에 담았습니다.',
  quote: '작지만 오래 간직할 수 있는 전통의 가치',
}

describe('ProductLandingPage', () => {
  it('제품명이 h1으로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByRole('heading', { name: '레진 갓 키링' })).toBeInTheDocument()
  })

  it('description이 있으면 한 줄 카피로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('전통의 아름다움을 일상 속에')).toBeInTheDocument()
  })

  it('keywords가 쉼표로 분리되어 배지로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('전통 소품')).toBeInTheDocument()
    expect(screen.getByText('핸드메이드')).toBeInTheDocument()
    expect(screen.getByText('선물 추천')).toBeInTheDocument()
  })

  it('body가 있으면 작품 소개 카드가 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('작품 소개')).toBeInTheDocument()
    expect(
      screen.getByText('한국 전통 갓의 우아한 선과 품격을 작은 키링에 담았습니다.')
    ).toBeInTheDocument()
  })

  it('quote가 있으면 강조 문장이 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('작지만 오래 간직할 수 있는 전통의 가치')).toBeInTheDocument()
  })

  it('body와 quote 모두 없으면 작품 소개 카드가 없다', () => {
    render(<ProductLandingPage product={{ ...baseProduct, body: null, quote: null }} />)
    expect(screen.queryByText('작품 소개')).not.toBeInTheDocument()
  })

  it('purchase_notes가 줄바꿈으로 분리되어 각 항목이 별도로 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByText('구매 전 확인사항')).toBeInTheDocument()
    expect(screen.getByText('핸드메이드 제품으로 색상·크기에 차이가 있습니다')).toBeInTheDocument()
    expect(screen.getByText('사진과 실물 색상이 다를 수 있습니다')).toBeInTheDocument()
  })

  it('idus_url이 있으면 구매하기 버튼과 작품 페이지 보기 버튼이 표시된다', () => {
    render(<ProductLandingPage product={baseProduct} />)
    expect(screen.getByRole('link', { name: /아이디어스에서 구매하기/ })).toHaveAttribute(
      'href',
      'https://www.idus.com/v2/product/abc123'
    )
    expect(screen.getByRole('link', { name: /아이디어스 작품 페이지 보기/ })).toHaveAttribute(
      'href',
      'https://www.idus.com/v2/product/abc123'
    )
  })

  it('idus_url이 없으면 링크 없고 준비 중 안내가 표시된다', () => {
    render(<ProductLandingPage product={{ ...baseProduct, idus_url: null }} />)
    expect(screen.queryByRole('link', { name: /구매하기/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /작품 페이지 보기/ })).not.toBeInTheDocument()
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
