'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import type { Store } from '@/lib/types'

const inputClass =
  'bg-white border border-gold/40 rounded-lg px-3 py-2 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stores')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setStores(data) })
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) {
      setCreateError(data.error ?? '매장 등록에 실패했습니다.')
      return
    }
    setStores((prev) => [...prev, data])
    setNewName('')
  }

  function startEdit(store: Store) {
    setEditingId(store.id)
    setEditName(store.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  async function handleSave(id: string) {
    if (!editName.trim()) return
    setSavingId(id)
    const res = await fetch(`/api/stores/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })
    const data = await res.json()
    setSavingId(null)
    if (!res.ok) return
    setStores((prev) => prev.map((s) => (s.id === id ? data : s)))
    setEditingId(null)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`'${name}' 매장을 삭제할까요?\n연결된 제품의 매장 정보가 해제됩니다.`)) return
    const res = await fetch(`/api/stores/${id}`, { method: 'DELETE' })
    if (res.ok) setStores((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      <nav className="bg-cream border-b border-gold/30 px-5 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-sm text-brown-light border border-gold/40 rounded-md px-3 py-1.5 hover:bg-gold/10 transition-colors"
            >
              ← 대시보드
            </Link>
            <div>
              <span className="text-lg font-bold text-brown-dark block">매장 관리</span>
              <span className="text-[10px] tracking-[2px] text-gold">STORES</span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-5 py-8">
        {/* 새 매장 등록 */}
        <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6 mb-6">
          <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-4">새 매장 등록</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className={labelClass}>
                매장명 <span className="text-gold">*</span>
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="공방 이름을 입력하세요"
                className={`${inputClass} w-full`}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="text-sm bg-gold text-cream font-bold px-5 py-2 rounded-lg hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? '등록 중...' : '등록'}
            </button>
          </div>
          {createError && <p className="text-xs text-red-500 mt-2">{createError}</p>}
        </div>

        {/* 매장 목록 */}
        <div className="bg-cream border border-gold/40 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gold/20 flex justify-between items-center">
            <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase">매장 목록</p>
            <span className="text-sm text-brown-light">{stores.length}개</span>
          </div>

          {loading ? (
            <p className="text-sm text-brown-muted px-6 py-8 text-center">불러오는 중...</p>
          ) : stores.length === 0 ? (
            <p className="text-sm text-brown-muted px-6 py-8 text-center">등록된 매장이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gold/10">
              {stores.map((store) => (
                <li key={store.id} className="px-6 py-4 flex items-center gap-4">
                  {editingId === store.id ? (
                    <>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(store.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        className={`${inputClass} flex-1`}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSave(store.id)}
                        disabled={savingId === store.id || !editName.trim()}
                        className="text-sm bg-gold text-cream font-bold px-4 py-1.5 rounded-lg hover:bg-gold/90 disabled:opacity-40 transition-colors"
                      >
                        {savingId === store.id ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-sm text-brown-light border border-gold/30 px-4 py-1.5 rounded-lg hover:bg-gold/10 transition-colors"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-brown-dark">{store.name}</p>
                        <p className="text-[11px] text-brown-muted mt-0.5">{store.slug}</p>
                      </div>
                      <button
                        onClick={() => startEdit(store)}
                        className="text-xs text-brown-light border border-gold/30 px-3 py-1.5 rounded-md hover:bg-gold/10 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(store.id, store.name)}
                        className="text-xs text-red-400 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
