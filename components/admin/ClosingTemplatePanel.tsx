'use client'

import { useState } from 'react'
import type { ClosingTemplate } from '@/lib/types'

export interface ClosingFormData {
  mode: 'existing' | 'new'
  templateId: string | null
  newTemplate: { name: string; body: string } | null
}

interface ClosingTemplatePanelCreateProps {
  mode: 'create'
  closingData: ClosingFormData | null
  templates: ClosingTemplate[]
  onChange: (data: ClosingFormData | null) => void
  onTemplatesChange?: (templates: ClosingTemplate[]) => void
}

interface ClosingTemplatePanelEditProps {
  mode: 'edit'
  currentTemplateId: string | null
  templates: ClosingTemplate[]
  qrId: string
  onUpdate: (templateId: string | null) => void
  onTemplatesChange?: (templates: ClosingTemplate[]) => void
}

export type ClosingTemplatePanelProps =
  | ClosingTemplatePanelCreateProps
  | ClosingTemplatePanelEditProps

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const selectClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold'

export function ClosingTemplatePanel(props: ClosingTemplatePanelProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBody, setNewBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBody, setEditBody] = useState('')

  const templates = props.templates

  const selectedTemplateId =
    props.mode === 'create'
      ? props.closingData?.mode === 'existing'
        ? props.closingData.templateId
        : ''
      : props.currentTemplateId ?? ''

  const selectedTemplate = templates.find((t) => t.id === (selectedTemplateId ?? '')) ?? null

  function handleExistingSelect(templateId: string) {
    if (props.mode === 'create') {
      props.onChange(templateId ? { mode: 'existing', templateId, newTemplate: null } : null)
    } else {
      setLoading(true)
      fetch(`/api/qr/${props.qrId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closing_template_id: templateId || null }),
      }).finally(() => {
        props.onUpdate(templateId || null)
        setLoading(false)
      })
    }
  }

  async function confirmNewTemplate() {
    if (!newName.trim() || !newBody.trim()) return

    if (props.mode === 'create') {
      props.onChange({
        mode: 'new',
        templateId: null,
        newTemplate: { name: newName.trim(), body: newBody.trim() },
      })
      setShowNewForm(false)
    } else {
      setLoading(true)
      const res = await fetch('/api/closing-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), body: newBody.trim() }),
      })
      if (res.ok) {
        const tpl: ClosingTemplate = await res.json()
        await fetch(`/api/qr/${props.qrId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ closing_template_id: tpl.id }),
        })
        props.onUpdate(tpl.id)
        setShowNewForm(false)
      }
      setLoading(false)
    }
  }

  async function confirmEditTemplate() {
    if (!editName.trim() || !editBody.trim() || !selectedTemplateId) return
    setLoading(true)
    const res = await fetch(`/api/closing-templates/${selectedTemplateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), body: editBody.trim() }),
    })
    if (res.ok) {
      const updated: ClosingTemplate = await res.json()
      const next = templates.map((t) => (t.id === updated.id ? updated : t))
      props.onTemplatesChange?.(next)
      setShowEditForm(false)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {!showNewForm && !showEditForm && (
        <>
          <div>
            <label className="block text-xs font-bold text-brown-mid mb-1">마무리 문구 선택</label>
            <select
              value={selectedTemplateId ?? ''}
              onChange={(e) => handleExistingSelect(e.target.value)}
              className={selectClass}
              disabled={loading}
            >
              <option value="">마무리 문구 없음</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            {selectedTemplate && (
              <button
                type="button"
                onClick={() => {
                  setEditName(selectedTemplate.name)
                  setEditBody(selectedTemplate.body)
                  setShowEditForm(true)
                }}
                className="self-start text-xs px-3 py-1.5 border border-gold/40 rounded text-brown-mid hover:bg-gold/10"
              >
                템플릿 수정
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              className="self-start text-xs px-3 py-1.5 border border-gold/40 rounded text-brown-mid hover:bg-gold/10"
            >
              새 템플릿 만들기
            </button>
          </div>
        </>
      )}

      {showNewForm && (
        <div className="border border-gold/30 rounded-lg p-4 bg-white flex flex-col gap-3">
          <p className="text-xs font-bold text-brown-dark">새 마무리 문구 템플릿</p>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="템플릿 이름 (예: 레진 키링 마무리)"
            className={inputClass}
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="마무리 문구를 입력하세요"
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmNewTemplate}
              disabled={!newName.trim() || !newBody.trim() || loading}
              className="px-4 py-2 text-sm bg-gold text-cream rounded-lg hover:bg-gold/90 disabled:opacity-50"
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 text-sm border border-gold/40 rounded-lg text-brown-light hover:bg-gold/10"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="border border-gold/30 rounded-lg p-4 bg-white flex flex-col gap-3">
          <p className="text-xs font-bold text-brown-dark">마무리 문구 템플릿 수정</p>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="템플릿 이름"
            className={inputClass}
          />
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            placeholder="마무리 문구를 입력하세요"
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <p className="text-[11px] text-brown-muted bg-gold/5 border border-gold/20 rounded px-2.5 py-1.5">
            ⚠ 이 템플릿을 사용하는 모든 제품에 반영됩니다
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmEditTemplate}
              disabled={!editName.trim() || !editBody.trim() || loading}
              className="px-4 py-2 text-sm bg-gold text-cream rounded-lg hover:bg-gold/90 disabled:opacity-50"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => setShowEditForm(false)}
              className="px-4 py-2 text-sm border border-gold/40 rounded-lg text-brown-light hover:bg-gold/10"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {props.mode === 'create' && props.closingData?.mode === 'new' && props.closingData.newTemplate && (
        <div className="text-xs text-brown-mid bg-cream-bg rounded-lg px-3 py-2">
          새 템플릿:{' '}
          <span className="font-bold text-brown-dark">{props.closingData.newTemplate.name}</span>
          <button
            type="button"
            onClick={() => {
              setNewName(props.closingData!.newTemplate!.name)
              setNewBody(props.closingData!.newTemplate!.body)
              setShowNewForm(true)
              props.onChange(null)
            }}
            className="ml-2 text-gold underline"
          >
            수정
          </button>
        </div>
      )}
    </div>
  )
}
