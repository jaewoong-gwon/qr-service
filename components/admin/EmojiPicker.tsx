'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import data from '@emoji-mart/data'

const Picker = dynamic(() => import('@emoji-mart/react'), { ssr: false })

interface EmojiPickerProps {
  value: string | null
  onChange: (emoji: string | null) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative flex-shrink-0 flex items-center gap-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="이모지 선택"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gold/40 bg-white hover:bg-gold/10 transition-colors text-base"
      >
        {value ?? <span className="text-brown-muted text-xs">＋</span>}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          title="이모지 제거"
          className="w-5 h-5 flex items-center justify-center rounded-full text-brown-muted hover:text-red-400 hover:bg-red-50 transition-colors text-xs"
        >
          ×
        </button>
      )}

      {open && (
        <div className="absolute left-0 top-10 z-30">
          <Picker
            data={data}
            locale="ko"
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
            onEmojiSelect={(emoji: { native: string }) => {
              onChange(emoji.native)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
