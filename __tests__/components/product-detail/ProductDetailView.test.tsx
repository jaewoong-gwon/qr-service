// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductDetailView } from '@/components/product-detail/ProductDetailView'
import type { ProductSection } from '@/lib/types'

vi.mock('@/components/product-detail/sections/HeroSection', () => ({
  HeroSection: ({ content }: { content: { title: string } }) => <div>{content.title}</div>,
}))
vi.mock('@/components/product-detail/sections/TextBlockSection', () => ({
  TextBlockSection: ({ content }: { content: { heading: string } }) => <div>{content.heading}</div>,
}))
vi.mock('@/components/product-detail/sections/FeatureCardsSection', () => ({
  FeatureCardsSection: () => <div>feature-cards</div>,
}))
vi.mock('@/components/product-detail/sections/SpecsSection', () => ({
  SpecsSection: () => <div>specs</div>,
}))
vi.mock('@/components/product-detail/sections/RecommendListSection', () => ({
  RecommendListSection: () => <div>recommend-list</div>,
}))
vi.mock('@/components/product-detail/sections/QuoteSection', () => ({
  QuoteSection: ({ content }: { content: { text: string } }) => <div>{content.text}</div>,
}))
vi.mock('@/components/product-detail/sections/PhotoSection', () => ({
  PhotoSection: () => <div>photo-section</div>,
}))

const heroSection: ProductSection = {
  id: '1',
  product_id: 'p1',
  section_type: 'hero',
  display_order: 1,
  content: { title: '명태 키링', subtitle: '전통 액막이' },
}

const quoteSection: ProductSection = {
  id: '2',
  product_id: 'p1',
  section_type: 'quote',
  display_order: 2,
  content: { text: '잘 되길 바라는 마음' },
}

describe('ProductDetailView', () => {
  it('renders hero section', () => {
    render(<ProductDetailView sections={[heroSection]} />)
    expect(screen.getByText('명태 키링')).toBeInTheDocument()
  })

  it('renders quote section', () => {
    render(<ProductDetailView sections={[quoteSection]} />)
    expect(screen.getByText('잘 되길 바라는 마음')).toBeInTheDocument()
  })

  it('renders multiple sections in order', () => {
    render(<ProductDetailView sections={[heroSection, quoteSection]} />)
    expect(screen.getByText('명태 키링')).toBeInTheDocument()
    expect(screen.getByText('잘 되길 바라는 마음')).toBeInTheDocument()
  })

  it('renders header and footer', () => {
    render(<ProductDetailView sections={[heroSection]} />)
    expect(screen.getByText('작품 이야기')).toBeInTheDocument()
  })
})