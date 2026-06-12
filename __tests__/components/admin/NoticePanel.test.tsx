// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NoticePanel } from '@/components/admin/NoticePanel'
import type { NoticeGroup } from '@/lib/types'

const mockGroups: (NoticeGroup & { id: string; name: string })[] = [
  { id: 'g1', name: '레진 상품 공통 안내', notice_group_items: [] },
]

describe('NoticePanel (create mode)', () => {
  it('renders "없음" option by default', () => {
    render(<NoticePanel mode="create" noticeData={null} groups={[]} onChange={() => {}} />)
    expect(screen.getByText('구매 안내 없음')).toBeInTheDocument()
  })

  it('shows new group form when 새 그룹 만들기 is clicked', () => {
    render(<NoticePanel mode="create" noticeData={null} groups={[]} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '새 그룹 만들기' }))
    expect(screen.getByPlaceholderText('그룹명 (예: 레진 상품 공통 안내)')).toBeInTheDocument()
  })

  it('renders existing groups in dropdown', () => {
    render(<NoticePanel mode="create" noticeData={null} groups={mockGroups} onChange={() => {}} />)
    expect(screen.getByRole('option', { name: '레진 상품 공통 안내' })).toBeInTheDocument()
  })
})
