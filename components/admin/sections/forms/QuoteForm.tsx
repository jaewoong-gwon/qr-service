'use client'

import { useState } from 'react'
import type { QuoteContent, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'

interface QuoteFormProps {
  initialContent: QuoteContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

export function QuoteForm({ initialContent, onSave, onCancel, loading, error }: QuoteFormProps) {
  const [text, setText] = useState(initialContent.text)
  const [attribution, setAttribution] = useState(initialContent.attribution ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ text, attribution: attribution || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>
          인용 텍스트 <span className="text-gold">*</span>
        </label>
        <textarea
          aria-label="인용 텍스트"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
          required
        />
      </div>
      <div>
        <label className={labelClass}>
          출처 <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
        </label>
        <input
          value={attribution}
          onChange={(e) => setAttribution(e.target.value)}
          className={inputClass}
          placeholder="홍길동, 구매자"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors">{loading ? '저장 중...' : '저장'}</button>
      </div>
    </form>
  )
}
