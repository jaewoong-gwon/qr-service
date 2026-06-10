'use client'

import { useState } from 'react'
import type { RecommendListContent, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'

interface RecommendListFormProps {
  initialContent: RecommendListContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

export function RecommendListForm({ initialContent, onSave, onCancel, loading, error }: RecommendListFormProps) {
  const [heading, setHeading] = useState(initialContent.heading)
  const [items, setItems] = useState<string[]>(initialContent.items.length > 0 ? initialContent.items : [''])

  function updateItem(index: number, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  function addItem() {
    setItems((prev) => [...prev, ''])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ heading, items: items.filter(Boolean) })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>제목 <span className="text-gold">*</span></label>
        <input value={heading} onChange={(e) => setHeading(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>항목</label>
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                className={inputClass}
                placeholder={`항목 ${index + 1}`}
              />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(index)} className="px-2 text-red-400 hover:text-red-600 flex-shrink-0">×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-xs text-gold border border-gold/40 rounded-lg px-3 py-1.5 hover:bg-gold/10 self-start transition-colors">+ 항목 추가</button>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors">{loading ? '저장 중...' : '저장'}</button>
      </div>
    </form>
  )
}
