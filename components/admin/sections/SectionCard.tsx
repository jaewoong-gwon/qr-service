'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SectionForm } from './SectionForm'
import { SECTION_TYPE_LABELS } from './sectionTypeLabels'
import type { ProductSection, SectionContent } from '@/lib/types'

interface SectionCardProps {
  section: ProductSection
  productId: string
  isExpanded: boolean
  onToggle: () => void
  onSave: (section: ProductSection) => void
  onDelete: (id: string) => void
}

export function SectionCard({ section, productId, isExpanded, onToggle, onSave, onDelete }: SectionCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  async function handleSave(content: SectionContent) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${productId}/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '저장 실패'); return }
      onSave(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/products/${productId}/sections/${section.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(section.id)
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-cream border border-gold/40 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <button {...attributes} {...listeners} className="text-gold/60 hover:text-gold cursor-grab active:cursor-grabbing" aria-label="드래그 핸들">≡</button>
        <span className="text-[10px] font-bold tracking-[2px] text-gold flex-1">{SECTION_TYPE_LABELS[section.section_type]}</span>
        <button onClick={onToggle} className="text-xs px-2.5 py-1 rounded border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">
          {isExpanded ? '닫기' : '편집'}
        </button>
        <button onClick={handleDelete} className="text-xs px-2.5 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors">삭제</button>
      </div>
      {isExpanded && (
        <div className="border-t border-gold/20 px-4 py-4">
          <SectionForm section={section} onSave={handleSave} onCancel={onToggle} loading={loading} error={error} />
        </div>
      )}
    </div>
  )
}
