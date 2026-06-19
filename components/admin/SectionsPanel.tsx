'use client'

import { useState } from 'react'
import type { ProductSection } from '@/lib/types'
import { EmojiPicker } from '@/components/admin/EmojiPicker'

interface SectionsPanelCreateProps {
  mode: 'create'
  sections: ProductSection[]
  onChange: (sections: ProductSection[]) => void
}

interface SectionsPanelEditProps {
  mode: 'edit'
  sections: ProductSection[]
  qrId: string
  onUpdate: (sections: ProductSection[]) => void
}

export type SectionsPanelProps = SectionsPanelCreateProps | SectionsPanelEditProps

const SECTION_TYPES = [
  { value: 'meaning' as const, label: '추가 설명' },
]

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const selectClass =
  'bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold'
const labelClass = 'text-xs font-bold text-brown-mid mb-1'

function newSection(sortOrder: number): ProductSection {
  return {
    id: crypto.randomUUID(),
    section_type: 'meaning',
    title: null,
    body: null,
    sort_order: sortOrder,
  }
}

export function SectionsPanel(props: SectionsPanelProps) {
  const [loading, setLoading] = useState(false)
  const sections = props.sections

  function updateSections(next: ProductSection[]) {
    if (props.mode === 'create') props.onChange(next)
    else props.onUpdate(next)
  }

  async function addSection() {
    if (props.mode === 'create') {
      updateSections([...sections, newSection(sections.length)])
      return
    }
    setLoading(true)
    const res = await fetch(`/api/qr/${props.qrId}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_type: 'meaning', title: null, body: null, sort_order: sections.length }),
    })
    if (res.ok) {
      const data = await res.json()
      props.onUpdate([...sections, data])
    }
    setLoading(false)
  }

  async function removeSection(index: number) {
    const section = sections[index]
    if (props.mode === 'edit') {
      setLoading(true)
      await fetch(`/api/qr/${props.qrId}/sections/${section.id}`, { method: 'DELETE' })
      setLoading(false)
    }
    updateSections(sections.filter((_, i) => i !== index))
  }

  function updateField(index: number, field: keyof ProductSection, value: string | null) {
    const next = sections.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    updateSections(next)
  }

  async function saveField(index: number, field: string, value: string | null) {
    if (props.mode !== 'edit') return
    const section = sections[index]
    await fetch(`/api/qr/${props.qrId}/sections/${section.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
  }

  function moveSection(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sections.length) return
    const next = [...sections]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    next.forEach((s, i) => {
      s.sort_order = i
    })
    updateSections(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section, sIdx) => {
        return (
          <div key={section.id} className="border border-gold/30 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <select
                value="meaning"
                onChange={(e) => {
                  updateField(sIdx, 'section_type', e.target.value)
                  if (props.mode === 'edit') saveField(sIdx, 'section_type', e.target.value)
                }}
                className={selectClass}
              >
                {SECTION_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="flex gap-1 ml-auto">
                <button
                  type="button"
                  onClick={() => moveSection(sIdx, -1)}
                  disabled={sIdx === 0 || loading}
                  className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(sIdx, 1)}
                  disabled={sIdx === sections.length - 1 || loading}
                  className="px-2 py-1 text-xs border border-gold/30 rounded text-brown-mid hover:bg-gold/10 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label="섹션 삭제"
                  onClick={() => removeSection(sIdx)}
                  disabled={loading}
                  className="px-2 py-1 text-xs border border-red-200 rounded text-red-400 hover:bg-red-50 disabled:opacity-30"
                >
                  삭제
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className={labelClass}>제목</p>
                <div className="flex gap-2 items-center">
                  <EmojiPicker
                    value={section.icon ?? null}
                    onChange={(emoji) => {
                      updateField(sIdx, 'icon', emoji)
                      if (props.mode === 'edit') saveField(sIdx, 'icon', emoji)
                    }}
                  />
                  <input
                    value={section.title ?? ''}
                    onChange={(e) => updateField(sIdx, 'title', e.target.value || null)}
                    onBlur={(e) => saveField(sIdx, 'title', e.target.value || null)}
                    placeholder="제목을 입력하세요"
                    className={`${inputClass} flex-1`}
                  />
                </div>
              </div>
              <div>
                <p className={labelClass}>설명</p>
                <textarea
                  value={section.body ?? ''}
                  onChange={(e) => updateField(sIdx, 'body', e.target.value || null)}
                  onBlur={(e) => saveField(sIdx, 'body', e.target.value || null)}
                  placeholder="설명을 입력하세요"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={addSection}
        disabled={loading}
        className="w-full py-2.5 text-sm border border-dashed border-gold/50 rounded-lg text-brown-mid hover:bg-gold/5 disabled:opacity-50 transition-colors"
      >
        + 섹션 추가
      </button>
    </div>
  )
}
