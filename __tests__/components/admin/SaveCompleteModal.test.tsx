// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SaveCompleteModal } from '@/components/admin/SaveCompleteModal'

const defaultProps = {
  open: true,
  title: '저장되었습니다 ✓',
  message: '변경사항이 저장되었습니다',
  primaryLabel: '계속 수정하기',
  onPrimary: vi.fn(),
  secondaryLabel: '홈으로',
  onSecondary: vi.fn(),
}

describe('SaveCompleteModal', () => {
  it('open=true 이면 모달이 표시된다', () => {
    render(<SaveCompleteModal {...defaultProps} />)
    expect(screen.getByText('저장되었습니다 ✓')).toBeInTheDocument()
    expect(screen.getByText('변경사항이 저장되었습니다')).toBeInTheDocument()
  })

  it('open=false 이면 렌더링되지 않는다', () => {
    render(<SaveCompleteModal {...defaultProps} open={false} />)
    expect(screen.queryByText('저장되었습니다 ✓')).not.toBeInTheDocument()
  })

  it('primary 버튼 클릭 시 onPrimary가 호출된다', () => {
    const onPrimary = vi.fn()
    render(<SaveCompleteModal {...defaultProps} onPrimary={onPrimary} />)
    fireEvent.click(screen.getByRole('button', { name: '계속 수정하기' }))
    expect(onPrimary).toHaveBeenCalledTimes(1)
  })

  it('secondary 버튼 클릭 시 onSecondary가 호출된다', () => {
    const onSecondary = vi.fn()
    render(<SaveCompleteModal {...defaultProps} onSecondary={onSecondary} />)
    fireEvent.click(screen.getByRole('button', { name: '홈으로' }))
    expect(onSecondary).toHaveBeenCalledTimes(1)
  })

  it('버튼 레이블이 props에 따라 렌더링된다', () => {
    render(<SaveCompleteModal {...defaultProps} primaryLabel="수정 계속하기" secondaryLabel="대시보드로" />)
    expect(screen.getByRole('button', { name: '수정 계속하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '대시보드로' })).toBeInTheDocument()
  })
})
