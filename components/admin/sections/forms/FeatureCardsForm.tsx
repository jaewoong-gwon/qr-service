'use client'

import { useState } from 'react'
import type { FeatureCardsContent, FeatureCard, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'
import { DriveUrlInput } from '../DriveUrlInput'

interface FeatureCardsFormProps {
  initialContent: FeatureCardsContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

const emptyCard: FeatureCard = { icon_drive_id: '', title: '', description: '' }

export function FeatureCardsForm({ initialContent, onSave, onCancel, loading, error }: FeatureCardsFormProps) {
  const [heading, setHeading] = useState(initialContent.heading)
  const [cards, setCards] = useState<FeatureCard[]>(initialContent.cards.length > 0 ? initialContent.cards : [{ ...emptyCard }])

  function updateCard(index: number, field: keyof FeatureCard, value: string) {
    setCards((prev) => prev.map((card, i) => (i === index ? { ...card, [field]: value } : card)))
  }

  function addCard() {
    setCards((prev) => [...prev, { ...emptyCard }])
  }

  function removeCard(index: number) {
    setCards((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ heading, cards })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>제목 <span className="text-gold">*</span></label>
        <input value={heading} onChange={(e) => setHeading(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>카드 목록</label>
        <div className="flex flex-col gap-4">
          {cards.map((card, index) => (
            <div key={index} className="border border-gold/20 rounded-lg p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold">카드 {index + 1}</span>
                {cards.length > 1 && (
                  <button type="button" onClick={() => removeCard(index)} className="text-xs text-red-400 hover:text-red-600">× 삭제</button>
                )}
              </div>
              <div>
                <label className={labelClass}>아이콘 Drive URL</label>
                <DriveUrlInput value={card.icon_drive_id} onChange={(val) => updateCard(index, 'icon_drive_id', val)} />
              </div>
              <div>
                <label className={labelClass}>카드 제목 <span className="text-gold">*</span></label>
                <input value={card.title} onChange={(e) => updateCard(index, 'title', e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>설명 <span className="text-gold">*</span></label>
                <input value={card.description} onChange={(e) => updateCard(index, 'description', e.target.value)} className={inputClass} required />
              </div>
            </div>
          ))}
          <button type="button" onClick={addCard} className="text-xs text-gold border border-gold/40 rounded-lg px-3 py-1.5 hover:bg-gold/10 self-start transition-colors">+ 카드 추가</button>
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
