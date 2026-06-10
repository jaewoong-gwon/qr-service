'use client'

import { useState } from 'react'
import { parseDriveId } from '@/lib/drive'
import { inputClass } from './formStyles'

interface DriveUrlInputProps {
  value: string
  onChange: (id: string) => void
  placeholder?: string
  required?: boolean
}

export function DriveUrlInput({ value, onChange, placeholder, required }: DriveUrlInputProps) {
  const [raw, setRaw] = useState(value)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newRaw = e.target.value
    setRaw(newRaw)
    onChange(parseDriveId(newRaw))
  }

  const parsed = parseDriveId(raw)
  const showHint = raw.length > 0 && raw !== parsed

  return (
    <div>
      <input
        type="text"
        value={raw}
        onChange={handleChange}
        placeholder={placeholder ?? 'Google Drive URL 또는 파일 ID'}
        className={inputClass}
        required={required}
      />
      {showHint && (
        <p className="text-[11px] text-brown-muted mt-1">파일 ID: {parsed}</p>
      )}
    </div>
  )
}
