'use client'

import { useState } from 'react'
import type { ProductTag } from '@/lib/types'

interface TagsPanelCreateProps {
  mode: 'create'
  tags: ProductTag[]
  onChange: (tags: ProductTag[]) => void
}

interface TagsPanelEditProps {
  mode: 'edit'
  tags: (ProductTag & { id: string })[]
  qrId: string
  onUpdate: (tags: (ProductTag & { id: string })[]) => void
}

export type TagsPanelProps = TagsPanelCreateProps | TagsPanelEditProps

const inputClass =
  'bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'

export function TagsPanel(props: TagsPanelProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const tags = props.tags

  async function addTag() {
    const label = input.trim()
    if (!label) return

    if (props.mode === 'create') {
      props.onChange([...tags, { label, sort_order: tags.length }])
    } else {
      setLoading(true)
      const res = await fetch(`/api/qr/${props.qrId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, sort_order: tags.length }),
      })
      if (res.ok) {
        const data = await res.json()
        props.onUpdate([...props.tags, data])
      }
      setLoading(false)
    }
    setInput('')
  }

  async function removeTag(index: number) {
    if (props.mode === 'create') {
      props.onChange(tags.filter((_, i) => i !== index))
    } else {
      const tag = props.tags[index]
      setLoading(true)
      await fetch(`/api/qr/${props.qrId}/tags/${tag.id}`, { method: 'DELETE' })
      props.onUpdate(props.tags.filter((_, i) => i !== index))
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="flex items-center gap-1 text-xs font-medium text-brown-mid bg-cream-bg px-3 py-1 rounded-full border border-gold/30"
          >
            {tag.label}
            <button
              type="button"
              aria-label="✕"
              onClick={() => removeTag(i)}
              disabled={loading}
              className="ml-1 text-brown-muted hover:text-brown-dark leading-none"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder="태그 입력 후 Enter"
          className={`flex-1 ${inputClass}`}
          disabled={loading}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={loading || !input.trim()}
          className="px-4 py-2 text-sm bg-gold text-cream rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
        >
          추가
        </button>
      </div>
    </div>
  )
}
