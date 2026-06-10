'use client'

import { useState } from 'react'
import type { SpecsContent, SpecsItem, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'
import { DriveUrlInput } from '../DriveUrlInput'

interface SpecsFormProps {
  initialContent: SpecsContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

const emptyItem: SpecsItem = { image_drive_id: '', label: '' }

export function SpecsForm({ initialContent, onSave, onCancel, loading, error }: SpecsFormProps) {
  const [heading, setHeading] = useState(initialContent.heading)
  const [items, setItems] = useState<SpecsItem[]>(initialContent.items.length > 0 ? initialContent.items : [{ ...emptyItem }])
  const [note, setNote] = useState(initialContent.note ?? '')

  function updateItem(index: number, field: keyof SpecsItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ heading, items, note: note || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>제목 <span className="text-gold">*</span></label>
        <input value={heading} onChange={(e) => setHeading(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>스펙 항목</label>
        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <div key={index} className="border border-gold/20 rounded-lg p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold">항목 {index + 1}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="text-xs text-red-400 hover:text-red-600">× 삭제</button>
                )}
              </div>
              <div>
                <label className={labelClass}>이미지 Drive URL</label>
                <DriveUrlInput value={item.image_drive_id} onChange={(val) => updateItem(index, 'image_drive_id', val)} />
              </div>
              <div>
                <label className={labelClass}>레이블 <span className="text-gold">*</span></label>
                <input value={item.label} onChange={(e) => updateItem(index, 'label', e.target.value)} className={inputClass} required />
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-xs text-gold border border-gold/40 rounded-lg px-3 py-1.5 hover:bg-gold/10 self-start transition-colors">+ 항목 추가</button>
        </div>
      </div>
      <div>
        <label className={labelClass}>주석 <span className="text-[11px] text-brown-muted font-normal">(선택)</span></label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors">{loading ? '저장 중...' : '저장'}</button>
      </div>
    </form>
  )
}
