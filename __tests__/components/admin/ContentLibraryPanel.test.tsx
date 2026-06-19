// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContentLibraryPanel } from '@/components/admin/ContentLibraryPanel'
import type { ContentLibraryItem, ProductContentLink } from '@/lib/types'

const mockLibrary: ContentLibraryItem[] = [
  { id: 'cl1', title: '훈민정음', body: '세종대왕이 창제한 문자 체계' },
  { id: 'cl2', title: '달항아리', body: '조선 백자의 대표 작품' },
]

const mockLinks: ProductContentLink[] = [
  { id: 'pcl1', sort_order: 0, content_library: { id: 'cl1', title: '훈민정음', body: '세종대왕이 창제한 문자 체계' } },
]

describe('ContentLibraryPanel (create mode)', () => {
  it('라이브러리 드롭다운이 렌더링된다', () => {
    render(
      <ContentLibraryPanel
        mode="create"
        contentLinks={[]}
        contentLibrary={mockLibrary}
        onChange={() => {}}
      />
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('훈민정음')).toBeInTheDocument()
    expect(screen.getByText('달항아리')).toBeInTheDocument()
  })

  it('드롭다운에서 항목 선택 시 onChange가 content_id로 호출된다', () => {
    const onChange = vi.fn()
    render(
      <ContentLibraryPanel
        mode="create"
        contentLinks={[]}
        contentLibrary={mockLibrary}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'cl1' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content_id: 'cl1', new_content: null }),
      ])
    )
  })

  it('새 항목 만들기 버튼 클릭 시 폼이 나타난다', () => {
    render(
      <ContentLibraryPanel
        mode="create"
        contentLinks={[]}
        contentLibrary={mockLibrary}
        onChange={() => {}}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '새 항목 만들기' }))
    expect(screen.getByPlaceholderText('제목 (예: 훈민정음, 달항아리)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('설명을 입력하세요')).toBeInTheDocument()
  })

  it('새 항목 확인 시 onChange가 new_content로 호출된다', () => {
    const onChange = vi.fn()
    render(
      <ContentLibraryPanel
        mode="create"
        contentLinks={[]}
        contentLibrary={mockLibrary}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '새 항목 만들기' }))
    fireEvent.change(screen.getByPlaceholderText('제목 (예: 훈민정음, 달항아리)'), {
      target: { value: '경복궁' },
    })
    fireEvent.change(screen.getByPlaceholderText('설명을 입력하세요'), {
      target: { value: '조선의 법궁' },
    })
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content_id: null, new_content: { title: '경복궁', body: '조선의 법궁' } }),
      ])
    )
  })

  it('연결된 항목 목록이 표시되고 해제 버튼이 있다', () => {
    render(
      <ContentLibraryPanel
        mode="create"
        contentLinks={[{ content_id: 'cl1', new_content: null, sort_order: 0 }]}
        contentLibrary={mockLibrary}
        onChange={() => {}}
      />
    )
    expect(screen.getByText('훈민정음')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '해제' })).toBeInTheDocument()
  })

  it('해제 버튼 클릭 시 onChange가 빈 배열로 호출된다', () => {
    const onChange = vi.fn()
    render(
      <ContentLibraryPanel
        mode="create"
        contentLinks={[{ content_id: 'cl1', new_content: null, sort_order: 0 }]}
        contentLibrary={mockLibrary}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '해제' }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})

describe('ContentLibraryPanel (edit mode)', () => {
  it('현재 연결된 항목이 표시된다', () => {
    render(
      <ContentLibraryPanel
        mode="edit"
        contentLinks={mockLinks}
        contentLibrary={mockLibrary}
        qrId="qr1"
        onUpdate={() => {}}
      />
    )
    expect(screen.getByText('훈민정음')).toBeInTheDocument()
  })

  it('해제 버튼이 렌더링된다', () => {
    render(
      <ContentLibraryPanel
        mode="edit"
        contentLinks={mockLinks}
        contentLibrary={mockLibrary}
        qrId="qr1"
        onUpdate={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: '해제' })).toBeInTheDocument()
  })
})
