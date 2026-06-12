'use client'

import { useState } from 'react'
import type { NoticeGroup } from '@/lib/types'

export interface NoticeFormData {
  mode: 'existing' | 'new'
  groupId: string | null
  newGroup: { name: string; items: { content: string; sort_order: number }[] } | null
}

type NoticeGroupFull = NoticeGroup & { id: string; name: string }

interface NoticePanelCreateProps {
  mode: 'create'
  noticeData: NoticeFormData | null
  groups: NoticeGroupFull[]
  onChange: (data: NoticeFormData | null) => void
}

interface NoticePanelEditProps {
  mode: 'edit'
  currentGroupId: string | null
  groups: NoticeGroupFull[]
  qrId: string
  onUpdate: (groupId: string | null) => void
}

export type NoticePanelProps = NoticePanelCreateProps | NoticePanelEditProps

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const selectClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold'

export function NoticePanel(props: NoticePanelProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newItems, setNewItems] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)

  const groups = props.groups

  function handleExistingSelect(groupId: string) {
    if (props.mode === 'create') {
      props.onChange(groupId ? { mode: 'existing', groupId, newGroup: null } : null)
    } else {
      setLoading(true)
      fetch(`/api/qr/${props.qrId}/notice`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notice_group_id: groupId || null }),
      }).finally(() => {
        props.onUpdate(groupId || null)
        setLoading(false)
      })
    }
  }

  function addItemRow() {
    setNewItems([...newItems, ''])
  }

  function updateItemRow(index: number, value: string) {
    setNewItems(newItems.map((v, i) => (i === index ? value : v)))
  }

  function removeItemRow(index: number) {
    setNewItems(newItems.filter((_, i) => i !== index))
  }

  function confirmNewGroup() {
    const items = newItems
      .map((content, i) => ({ content: content.trim(), sort_order: i }))
      .filter((item) => item.content)

    if (props.mode === 'create') {
      props.onChange({
        mode: 'new',
        groupId: null,
        newGroup: { name: newGroupName.trim(), items },
      })
      setShowNewForm(false)
    }
  }

  const selectedGroupId =
    props.mode === 'create'
      ? props.noticeData?.mode === 'existing'
        ? props.noticeData.groupId
        : ''
      : props.currentGroupId ?? ''

  return (
    <div className="flex flex-col gap-3">
      {!showNewForm && (
        <>
          <div>
            <label className="block text-xs font-bold text-brown-mid mb-1">기존 그룹 선택</label>
            <select
              value={selectedGroupId ?? ''}
              onChange={(e) => handleExistingSelect(e.target.value)}
              className={selectClass}
              disabled={loading}
            >
              <option value="">구매 안내 없음</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="self-start text-xs px-3 py-1.5 border border-gold/40 rounded text-brown-mid hover:bg-gold/10"
          >
            새 그룹 만들기
          </button>
        </>
      )}

      {showNewForm && (
        <div className="border border-gold/30 rounded-lg p-4 bg-white flex flex-col gap-3">
          <p className="text-xs font-bold text-brown-dark">새 구매 안내 그룹</p>
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="그룹명 (예: 레진 상품 공통 안내)"
            className={inputClass}
          />
          <div className="flex flex-col gap-2">
            {newItems.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={item}
                  onChange={(e) => updateItemRow(i, e.target.value)}
                  placeholder={`안내 항목 ${i + 1}`}
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={() => removeItemRow(i)}
                  className="px-2 text-red-400 border border-red-200 rounded hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addItemRow}
              className="self-start text-xs px-3 py-1.5 border border-gold/40 rounded text-brown-mid hover:bg-gold/10"
            >
              + 항목 추가
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmNewGroup}
              disabled={!newGroupName.trim()}
              className="px-4 py-2 text-sm bg-gold text-cream rounded-lg hover:bg-gold/90 disabled:opacity-50"
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 text-sm border border-gold/40 rounded-lg text-brown-light hover:bg-gold/10"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {props.mode === 'create' && props.noticeData?.mode === 'new' && props.noticeData.newGroup && (
        <div className="text-xs text-brown-mid bg-cream-bg rounded-lg px-3 py-2">
          새 그룹: <span className="font-bold text-brown-dark">{props.noticeData.newGroup.name}</span>
          {' '}({props.noticeData.newGroup.items.length}개 항목)
          <button
            type="button"
            onClick={() => {
              setShowNewForm(true)
              props.onChange(null)
            }}
            className="ml-2 text-gold underline"
          >
            수정
          </button>
        </div>
      )}
    </div>
  )
}
