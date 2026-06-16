'use client'

import { useState, useRef, useEffect } from 'react'
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
  productId: string
  onUpdate: (tags: (ProductTag & { id: string })[]) => void
}

export type TagsPanelProps = TagsPanelCreateProps | TagsPanelEditProps

const inputClass =
  'bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'

export function TagsPanel(props: TagsPanelProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const tags = props.tags
  const existingLabels = new Set(tags.map((t) => t.label))

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchSuggestions(q: string) {
    if (props.mode !== 'edit' || !q) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    const params = new URLSearchParams({ q, excludeProductId: props.productId })
    const res = await fetch(`/api/tags/search?${params}`)
    if (!res.ok) return
    const data: string[] = await res.json()
    const filtered = data.filter((label) => !existingLabels.has(label))
    setSuggestions(filtered)
    setShowDropdown(true)
  }

  function handleInputChange(value: string) {
    setInput(value)
    if (props.mode === 'edit') {
      fetchSuggestions(value.trim())
    }
  }

  async function addTag(label?: string) {
    const targetLabel = (label ?? input).trim()
    if (!targetLabel) return

    // 이미 추가된 태그 중복 차단
    if (existingLabels.has(targetLabel)) {
      setInput('')
      setShowDropdown(false)
      return
    }

    if (props.mode === 'create') {
      props.onChange([...tags, { label: targetLabel, sort_order: tags.length }])
    } else {
      setLoading(true)
      const res = await fetch(`/api/qr/${props.qrId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: targetLabel, sort_order: tags.length }),
      })
      if (res.ok) {
        const data = await res.json()
        props.onUpdate([...props.tags, data])
      }
      setLoading(false)
    }

    setInput('')
    setSuggestions([])
    setShowDropdown(false)
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

  const visibleSuggestions = suggestions.filter((s) => !existingLabels.has(s))
  const showHint = props.mode === 'edit' && showDropdown && input.trim() && visibleSuggestions.length === 0

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

      <div ref={containerRef} className="relative">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
              if (e.key === 'Escape') {
                setShowDropdown(false)
              }
            }}
            onFocus={() => {
              if (props.mode === 'edit' && suggestions.length > 0) setShowDropdown(true)
            }}
            placeholder="태그 입력 후 Enter"
            className={`flex-1 ${inputClass}`}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => addTag()}
            disabled={loading || !input.trim()}
            className="px-4 py-2 text-sm bg-gold text-cream rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            추가
          </button>
        </div>

        {/* 자동완성 드롭다운 (edit 모드 전용) */}
        {props.mode === 'edit' && showDropdown && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gold/30 rounded-lg shadow-lg z-10 overflow-hidden">
            {visibleSuggestions.length > 0 ? (
              <ul>
                {visibleSuggestions.map((label) => (
                  <li key={label}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        addTag(label)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-brown-dark hover:bg-cream-bg transition-colors"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : showHint ? (
              <p className="px-3 py-2 text-xs text-brown-muted">
                작성 후 엔터를 누르시면 새로 생성됩니다
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
