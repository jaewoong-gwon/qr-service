// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { ProductPageView } from '@/components/ProductPageView'
import type { Product } from '@/lib/types'

const product: Product = {
  id: '1',
  qr_code_id: 'qr1',
  name: '레진 갓 키링',
  description: '전통 키링',
  price: '27,000원',
  materials: '레진',
  dimensions: '4.5cm',
}

describe('ProductPageView', () => {
  it('renders not-found message when product is null', () => {
    render(<ProductPageView product={null} images={[]} />)
    expect(screen.getByText('제품 정보를 찾을 수 없습니다.')).toBeInTheDocument()
  })

  it('renders product name as heading', () => {
    render(<ProductPageView product={product} images={[]} />)
    expect(screen.getByRole('heading', { name: '레진 갓 키링' })).toBeInTheDocument()
  })

  it('renders empty gallery message when no images', () => {
    render(<ProductPageView product={product} images={[]} />)
    expect(screen.getByText('사진 준비 중입니다.')).toBeInTheDocument()
  })
})
