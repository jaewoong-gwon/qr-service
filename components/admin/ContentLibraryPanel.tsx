'use client'

import { useState } from 'react'
import type { ContentLibraryItem, ProductContentLink } from '@/lib/types'
import { EmojiPicker } from '@/components/admin/EmojiPicker'

export interface ContentLinkFormData {
  content_id: string | null
  new_content: { title: string; body: string; icon?: string | null } | null
  sort_order: number
}

interface ContentLibraryPanelCreateProps {
  mode: 'create'
  contentLinks: ContentLinkFormData[]
  contentLibrary: ContentLibraryItem[]
  onChange: (links: ContentLinkFormData[]) => void
}

interface ContentLibraryPanelEditProps {
  mode: 'edit'
  contentLinks: ProductContentLink[]
  contentLibrary: ContentLibraryItem[]
  qrId: string
  onUpdate: (links: ProductContentLink[]) => void
  onContentLibraryChange?: (library: ContentLibraryItem[]) => void
}

export type ContentLibraryPanelProps = ContentLibraryPanelCreateProps | ContentLibraryPanelEditProps

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const selectClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold'

export function ContentLibraryPanel(props: ContentLibraryPanelProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newIcon, setNewIcon] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editIcon, setEditIcon] = useState<string | null>(null)

  const usedContentIds =
    props.mode === 'create'
      ? props.contentLinks.map((l) => l.content_id).filter(Boolean) as string[]
      : props.contentLinks.map((l) => l.content_library.id)

  function resolveTitle(link: ContentLinkFormData): string {
    if (link.new_content) return link.new_content.title
    const item = props.contentLibrary.find((c) => c.id === link.content_id)
    return item?.title ?? link.content_id ?? ''
  }

  function resolveIcon(link: ContentLinkFormData): string | null | undefined {
    if (link.new_content) return link.new_content.icon
    const item = props.contentLibrary.find((c) => c.id === link.content_id)
    return item?.icon
  }

  function handleDropdownSelect(contentId: string) {
    if (!contentId || props.mode !== 'create') return
    const next: ContentLinkFormData = { content_id: contentId, new_content: null, sort_order: props.contentLinks.length }
    props.onChange([...props.contentLinks, next])
  }

  async function handleDropdownSelectEdit(contentId: string) {
    if (!contentId || props.mode !== 'edit') return
    setLoading(true)
    const res = await fetch(`/api/qr/${props.qrId}/content-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: contentId, sort_order: props.contentLinks.length }),
    })
    if (res.ok) {
      const data: ProductContentLink = await res.json()
      props.onUpdate([...props.contentLinks, data])
    }
    setLoading(false)
  }

  function removeCreate(index: number) {
    if (props.mode !== 'create') return
    const next = props.contentLinks
      .filter((_, i) => i !== index)
      .map((l, i) => ({ ...l, sort_order: i }))
    props.onChange(next)
  }

  function openEdit(link: ProductContentLink) {
    setEditingLinkId(link.id)
    setEditTitle(link.content_library.title)
    setEditBody(link.content_library.body)
    setEditIcon(link.content_library.icon ?? null)
  }

  async function confirmEdit(link: ProductContentLink) {
    if (!editTitle.trim() || !editBody.trim() || props.mode !== 'edit') return
    setLoading(true)
    const res = await fetch(`/api/content-library/${link.content_library.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle.trim(), body: editBody.trim(), icon: editIcon }),
    })
    if (res.ok) {
      const updated: ContentLibraryItem = await res.json()
      props.onContentLibraryChange?.(
        props.contentLibrary.map((c) => (c.id === updated.id ? updated : c))
      )
      props.onUpdate(
        props.contentLinks.map((l) =>
          l.content_library.id === updated.id ? { ...l, content_library: updated } : l
        )
      )
    }
    setEditingLinkId(null)
    setLoading(false)
  }

  async function removeEdit(link: ProductContentLink) {
    if (props.mode !== 'edit') return
    setLoading(true)
    await fetch(`/api/qr/${props.qrId}/content-links/${link.id}`, { method: 'DELETE' })
    props.onUpdate(
      props.contentLinks
        .filter((l) => l.id !== link.id)
        .map((l, i) => ({ ...l, sort_order: i }))
    )
    setLoading(false)
  }

  function moveCreate(index: number, direction: -1 | 1) {
    if (props.mode !== 'create') return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= props.contentLinks.length) return
    const next = [...props.contentLinks]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    next.forEach((l, i) => { l.sort_order = i })
    props.onChange(next)
  }

  async function moveEdit(index: number, direction: -1 | 1) {
    if (props.mode !== 'edit') return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= props.contentLinks.length) return
    const next = [...props.contentLinks]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    next.forEach((l, i) => { l.sort_order = i })
    props.onUpdate(next)
    setLoading(true)
    await Promise.all([
      fetch(`/api/qr/${props.qrId}/content-links/${next[index].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: next[index].sort_order }),
      }),
      fetch(`/api/qr/${props.qrId}/content-links/${next[targetIndex].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: next[targetIndex].sort_order }),
      }),
    ])
    setLoading(false)
  }

  async function confirmNew() {
    if (!newTitle.trim() || !newBody.trim()) return

    if (props.mode === 'create') {
      const next: ContentLinkFormData = {
        content_id: null,
        new_content: { title: newTitle.trim(), body: newBody.trim(), icon: newIcon },
        sort_order: props.contentLinks.length,
      }
      props.onChange([...props.contentLinks, next])
      setNewTitle('')
      setNewBody('')
      setNewIcon(null)
      setShowNewForm(false)
      return
    }

    setLoading(true)
    const itemRes = await fetch('/api/content-library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), body: newBody.trim(), icon: newIcon }),
    })
    if (!itemRes.ok) { setLoading(false); return }
    const newItem: ContentLibraryItem = await itemRes.json()

    const linkRes = await fetch(`/api/qr/${props.qrId}/content-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: newItem.id, sort_order: props.contentLinks.length }),
    })
    if (linkRes.ok) {
      const data: ProductContentLink = await linkRes.json()
      props.onUpdate([...props.contentLinks, data])
      props.onContentLibraryChange?.([...props.contentLibrary, newItem])
    }
    setNewTitle('')
    setNewBody('')
    setNewIcon(null)
    setShowNewForm(false)
    setLoading(false)
  }

  const availableLibrary = props.contentLibrary.filter((c) => !usedContentIds.includes(c.id))

  return (
    <div className="flex flex-col gap-3">
      {!showNewForm && (
        <div className="flex gap-2">
          <select
            value=""
            onChange={(e) => {
              if (props.mode === 'create') handleDropdownSelect(e.target.value)
              else handleDropdownSelectEdit(e.target.value)
              e.target.value = ''
            }}
            className={selectClass}
            disabled={loading}
          >
            <option value="">라이브러리에서 선택</option>
            {availableLibrary.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="flex-shrink-0 text-xs px-3 py-2 border border-gold/40 rounded-lg text-brown-mid hover:bg-gold/10 whitespace-nowrap"
          >
            새 항목 만들기
          </button>
        </div>
      )}

      {showNewForm && (
        <div className="border border-gold/30 rounded-lg p-4 bg-white flex flex-col gap-3">
          <p className="text-xs font-bold text-brown-dark">새 콘텐츠 항목</p>
          <div className="flex gap-2 items-center">
            <EmojiPicker value={newIcon} onChange={setNewIcon} />
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="제목 (예: 훈민정음, 달항아리)"
              className={`${inputClass} flex-1`}
            />
          </div>
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="설명을 입력하세요"
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmNew}
              disabled={!newTitle.trim() || !newBody.trim() || loading}
              className="px-4 py-2 text-sm bg-gold text-cream rounded-lg hover:bg-gold/90 disabled:opacity-50"
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => { setShowNewForm(false); setNewTitle(''); setNewBody(''); setNewIcon(null) }}
              className="px-4 py-2 text-sm border border-gold/40 rounded-lg text-brown-light hover:bg-gold/10"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {props.mode === 'create' && props.contentLinks.length > 0 && (
        <div className="flex flex-col gap-2">
          {props.contentLinks.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2 border border-gold/20 rounded-lg px-3 py-2 bg-white">
              <span className="flex-1 text-sm text-brown-dark">
                {resolveIcon(link) && <span className="mr-1">{resolveIcon(link)}</span>}
                {resolveTitle(link)}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveCreate(idx, -1)}
                  disabled={idx === 0}
                  className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveCreate(idx, 1)}
                  disabled={idx === props.contentLinks.length - 1}
                  className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeCreate(idx)}
                  className="px-2 py-1 text-xs border border-red-200 rounded text-red-400 hover:bg-red-50"
                >
                  해제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {props.mode === 'edit' && props.contentLinks.length > 0 && (
        <div className="flex flex-col gap-2">
          {props.contentLinks.map((link, idx) =>
            editingLinkId === link.id ? (
              <div key={link.id} className="border border-gold/30 rounded-lg p-4 bg-white flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-brown-mid flex-1">콘텐츠 수정</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveEdit(idx, -1)}
                      disabled={idx === 0 || loading}
                      className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveEdit(idx, 1)}
                      disabled={idx === props.contentLinks.length - 1 || loading}
                      className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <EmojiPicker value={editIcon} onChange={setEditIcon} />
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="제목"
                    className={`${inputClass} flex-1`}
                  />
                </div>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="설명"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => confirmEdit(link)}
                    disabled={!editTitle.trim() || !editBody.trim() || loading}
                    className="px-3 py-1.5 text-xs bg-gold text-cream rounded-lg hover:bg-gold/90 disabled:opacity-50"
                  >
                    {loading ? '저장 중...' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingLinkId(null)}
                    className="px-3 py-1.5 text-xs border border-gold/40 rounded-lg text-brown-light hover:bg-gold/10"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEdit(link)}
                    disabled={loading}
                    className="ml-auto px-3 py-1.5 text-xs border border-red-200 rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-30"
                  >
                    해제
                  </button>
                </div>
              </div>
            ) : (
              <div key={link.id} className="flex items-center gap-2 border border-gold/20 rounded-lg px-3 py-2 bg-white">
                <span className="flex-1 text-sm text-brown-dark">
                  {link.content_library.icon && <span className="mr-1">{link.content_library.icon}</span>}
                  {link.content_library.title}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveEdit(idx, -1)}
                    disabled={idx === 0 || loading}
                    className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveEdit(idx, 1)}
                    disabled={idx === props.contentLinks.length - 1 || loading}
                    className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(link)}
                    disabled={loading}
                    className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEdit(link)}
                    disabled={loading}
                    className="px-2 py-1 text-xs border border-red-200 rounded text-red-400 hover:bg-red-50 disabled:opacity-30"
                  >
                    해제
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
