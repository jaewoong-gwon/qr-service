// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { GoldBorderCard } from '@/components/GoldBorderCard'

describe('GoldBorderCard', () => {
  it('renders children', () => {
    render(<GoldBorderCard><span>Test content</span></GoldBorderCard>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies additional className', () => {
    const { container } = render(
      <GoldBorderCard className="p-5">content</GoldBorderCard>
    )
    expect(container.firstChild).toHaveClass('p-5')
  })
})
