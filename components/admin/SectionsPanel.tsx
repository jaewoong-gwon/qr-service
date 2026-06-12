'use client'

import { useState } from 'react'
import type { ProductSection, ProductSectionItem, SectionType } from '@/lib/types'

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

const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  meaning: '의미',
  description: '제품 설명',
  color_meaning: '색상별 의미',
  symbol_meaning: '상징별 의미',
  option_story: '옵션 이야기',
  character_story: '캐릭터 이야기',
  place_story: '장소 이야기',
  closing: '마무리 문구',
}

const ITEM_TYPES: SectionType[] = ['color_meaning', 'symbol_meaning']

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const selectClass =
  'bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold'

function newSection(sortOrder: number): ProductSection {
  return {
    id: crypto.randomUUID(),
    section_type: 'meaning',
    title: null,
    body: null,
    sort_order: sortOrder,
    product_section_items: [],
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

  function addItem(sectionIndex: number) {
    const section = sections[sectionIndex]
    const newItem: ProductSectionItem = {
      title: null,
      description: null,
      sort_order: section.product_section_items.length,
    }
    const next = sections.map((s, i) =>
      i === sectionIndex
        ? { ...s, product_section_items: [...s.product_section_items, newItem] }
        : s
    )
    updateSections(next)
  }

  async function removeItem(sectionIndex: number, itemIndex: number) {
    const section = sections[sectionIndex]
    const item = section.product_section_items[itemIndex]
    if (props.mode === 'edit' && item.id) {
      setLoading(true)
      await fetch(`/api/qr/${props.qrId}/sections/${section.id}/items/${item.id}`, { method: 'DELETE' })
      setLoading(false)
    }
    const next = sections.map((s, i) =>
      i === sectionIndex
        ? { ...s, product_section_items: s.product_section_items.filter((_, j) => j !== itemIndex) }
        : s
    )
    updateSections(next)
  }

  function updateItem(sectionIndex: number, itemIndex: number, field: 'title' | 'description', value: string | null) {
    const next = sections.map((s, i) =>
      i === sectionIndex
        ? {
            ...s,
            product_section_items: s.product_section_items.map((item, j) =>
              j === itemIndex ? { ...item, [field]: value } : item
            ),
          }
        : s
    )
    updateSections(next)
  }

  async function saveItem(sectionIndex: number, itemIndex: number, field: string, value: string | null) {
    if (props.mode !== 'edit') return
    const section = sections[sectionIndex]
    const item = section.product_section_items[itemIndex]
    if (!item.id) return
    await fetch(`/api/qr/${props.qrId}/sections/${section.id}/items/${item.id}`, {
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
      {sections.map((section, sIdx) => (
        <div key={section.id} className="border border-gold/30 rounded-lg p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <select
              value={section.section_type}
              onChange={(e) => {
                updateField(sIdx, 'section_type', e.target.value)
                if (props.mode === 'edit') saveField(sIdx, 'section_type', e.target.value)
              }}
              className={selectClass}
            >
              {(Object.keys(SECTION_TYPE_LABELS) as SectionType[]).map((type) => (
                <option key={type} value={type}>
                  {SECTION_TYPE_LABELS[type]}
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

          <div className="flex flex-col gap-2">
            <input
              value={section.title ?? ''}
              onChange={(e) => updateField(sIdx, 'title', e.target.value || null)}
              onBlur={(e) => saveField(sIdx, 'title', e.target.value || null)}
              placeholder="제목 (선택)"
              className={inputClass}
            />
            <textarea
              value={section.body ?? ''}
              onChange={(e) => updateField(sIdx, 'body', e.target.value || null)}
              onBlur={(e) => saveField(sIdx, 'body', e.target.value || null)}
              placeholder="본문 내용"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {ITEM_TYPES.includes(section.section_type) && (
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-xs font-bold text-brown-mid">아이템</p>
              {section.product_section_items.map((item, iIdx) => (
                <div key={iIdx} className="flex gap-2 items-start">
                  <input
                    value={item.title ?? ''}
                    onChange={(e) => updateItem(sIdx, iIdx, 'title', e.target.value || null)}
                    onBlur={(e) => saveItem(sIdx, iIdx, 'title', e.target.value || null)}
                    placeholder="제목"
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    value={item.description ?? ''}
                    onChange={(e) => updateItem(sIdx, iIdx, 'description', e.target.value || null)}
                    onBlur={(e) => saveItem(sIdx, iIdx, 'description', e.target.value || null)}
                    placeholder="설명"
                    className={`${inputClass} flex-[2]`}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(sIdx, iIdx)}
                    disabled={loading}
                    className="px-2 py-2 text-xs text-red-400 border border-red-200 rounded hover:bg-red-50 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem(sIdx)}
                className="self-start text-xs px-3 py-1.5 border border-gold/40 rounded text-brown-mid hover:bg-gold/10"
              >
                + 아이템 추가
              </button>
            </div>
          )}
        </div>
      ))}

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
