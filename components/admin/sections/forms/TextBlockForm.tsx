'use client'

import { useState } from 'react'
import type { TextBlockContent, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'
import { DriveUrlInput } from '../DriveUrlInput'

interface TextBlockFormProps {
  initialContent: TextBlockContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

export function TextBlockForm({ initialContent, onSave, onCancel, loading, error }: TextBlockFormProps) {
  const [heading, setHeading] = useState(initialContent.heading)
  const [subheading, setSubheading] = useState(initialContent.subheading ?? '')
  const [body, setBody] = useState(initialContent.body)
  const [iconDriveId, setIconDriveId] = useState(initialContent.icon_drive_id ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ heading, subheading: subheading || undefined, body, icon_drive_id: iconDriveId || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>제목 <span className="text-gold">*</span></label>
        <input value={heading} onChange={(e) => setHeading(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>소제목 <span className="text-[11px] text-brown-muted font-normal">(선택)</span></label>
        <input value={subheading} onChange={(e) => setSubheading(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>본문 <span className="text-gold">*</span></label>
        <textarea aria-label="본문" value={body} onChange={(e) => setBody(e.target.value)} rows={4} className={`${inputClass} resize-none`} required />
      </div>
      <div>
        <label className={labelClass}>아이콘 Drive URL <span className="text-[11px] text-brown-muted font-normal">(선택)</span></label>
        <DriveUrlInput value={iconDriveId} onChange={setIconDriveId} />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors">{loading ? '저장 중...' : '저장'}</button>
      </div>
    </form>
  )
}
