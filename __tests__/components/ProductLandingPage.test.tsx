// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import type { Product } from '@/lib/types'

const base: Product = {
  id: 'p1',
  qr_code_id: 'qr1',
  store_id: null,
  name: '레진 갓 키링',
  subtitle: '전통의 아름다움을 일상 속에',
  idus_url: 'https://www.idus.com/v2/product/abc',
  is_active: true,
  product_tags: [
    { label: '핸드메이드', sort_order: 0 },
    { label: '전통 소품', sort_order: 1 },
  ],
  notice_groups: {
    notice_group_items: [
      { content: '핸드메이드 제품으로 색상·크기에 차이가 있습니다', sort_order: 0 },
    ],
  },
  product_sections: [
    {
      id: 's1',
      section_type: 'meaning',
      title: '갓의 의미',
      body: '한국 전통 갓의 우아한 선을 담았습니다.',
      sort_order: 0,
    },
  ],
}

describe('ProductLandingPage', () => {
  it('제품명이 h1으로 표시된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByRole('heading', { name: '레진 갓 키링' })).toBeInTheDocument()
  })

  it('subtitle이 표시된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByText('전통의 아름다움을 일상 속에')).toBeInTheDocument()
  })

  it('product_tags가 pill로 표시된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByText('핸드메이드')).toBeInTheDocument()
    expect(screen.getByText('전통 소품')).toBeInTheDocument()
  })

  it('구매 전 확인사항이 섹션보다 먼저 표시된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByText('구매 전 확인사항')).toBeInTheDocument()
    expect(
      screen.getByText('핸드메이드 제품으로 색상·크기에 차이가 있습니다')
    ).toBeInTheDocument()
  })

  it('meaning 섹션이 렌더링된다', () => {
    render(<ProductLandingPage product={base} />)
    expect(screen.getByText('갓의 의미')).toBeInTheDocument()
    expect(screen.getByText('한국 전통 갓의 우아한 선을 담았습니다.')).toBeInTheDocument()
  })


  it('idus_url이 있으면 아이디어스 링크가 표시된다', () => {
    render(<ProductLandingPage product={base} />)
    const link = screen.getByRole('link', { name: /아이디어스 작품 페이지 보기/ })
    expect(link).toHaveAttribute('href', 'https://www.idus.com/v2/product/abc')
  })

  it('idus_url이 없으면 아이디어스 링크가 없다', () => {
    render(<ProductLandingPage product={{ ...base, idus_url: null }} />)
    expect(screen.queryByRole('link', { name: /작품 페이지 보기/ })).not.toBeInTheDocument()
  })

  it('notice_groups가 없으면 구매 전 확인사항이 없다', () => {
    render(<ProductLandingPage product={{ ...base, notice_groups: null }} />)
    expect(screen.queryByText('구매 전 확인사항')).not.toBeInTheDocument()
  })

  it('product가 null이면 기본 문구가 표시된다', () => {
    render(<ProductLandingPage product={null} />)
    expect(screen.getByText('제품 정보 없음')).toBeInTheDocument()
  })
})
