'use client'

import { useState } from 'react'
import type { PhotoSectionContent, SectionContent } from '@/lib/types'
import { inputClass, labelClass } from '../formStyles'
import { DriveUrlInput } from '../DriveUrlInput'

interface PhotoSectionFormProps {
  initialContent: PhotoSectionContent
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

export function PhotoSectionForm({ initialContent, onSave, onCancel, loading, error }: PhotoSectionFormProps) {
  const [imageDriveId, setImageDriveId] = useState(initialContent.image_drive_id)
  const [heading, setHeading] = useState(initialContent.heading ?? '')
  const [body, setBody] = useState(initialContent.body ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ image_drive_id: imageDriveId, heading: heading || undefined, body: body || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>이미지 Drive URL <span className="text-gold">*</span></label>
        <DriveUrlInput value={imageDriveId} onChange={setImageDriveId} required />
      </div>
      <div>
        <label className={labelClass}>제목 <span className="text-[11px] text-brown-muted font-normal">(선택)</span></label>
        <input value={heading} onChange={(e) => setHeading(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>본문 <span className="text-[11px] text-brown-muted font-normal">(선택)</span></label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors">{loading ? '저장 중...' : '저장'}</button>
      </div>
    </form>
  )
}
