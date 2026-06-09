'use client'

import { useState } from 'react'
import { SectionForm } from './SectionForm'
import { SECTION_TYPE_LABELS } from './sectionTypeLabels'
import type { ProductSection, SectionContent, SectionType } from '@/lib/types'

interface NewSectionCardProps {
  sectionType: SectionType
  productId: string
  displayOrder: number
  onSave: (section: ProductSection) => void
  onCancel: () => void
}

export function NewSectionCard({ sectionType, productId, displayOrder, onSave, onCancel }: NewSectionCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(content: SectionContent) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${productId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_type: sectionType, display_order: displayOrder, content }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '저장 실패'); return }
      onSave(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-cream border border-gold/40 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-[2px] text-gold flex-1">
          {SECTION_TYPE_LABELS[sectionType]} — 새 섹션
        </span>
      </div>
      <div className="border-t border-gold/20 px-4 py-4">
        <SectionForm section={null} sectionType={sectionType} onSave={handleSave} onCancel={onCancel} loading={loading} error={error} />
      </div>
    </div>
  )
}
