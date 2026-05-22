// components/QrTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { QrDisplay } from '@/components/QrDisplay'
import type { QrCodeWithProduct } from '@/lib/types'

interface QrTableProps {
  items: QrCodeWithProduct[]
}

export function QrTable({ items }: QrTableProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const router = useRouter()

  const [editingItem, setEditingItem] = useState<QrCodeWithProduct | null>(null)
  const [downloadItem, setDownloadItem] = useState<QrCodeWithProduct | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDelete(item: QrCodeWithProduct) {
    const productName = item.products?.name ?? item.slug
    if (!confirm(`"${productName}" QR 코드를 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/qr/${item.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('삭제에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  function openEditModal(item: QrCodeWithProduct) {
    setEditingItem(item)
    setNewUrl(item.drive_folder_url)
    setError('')
  }

  function closeEditModal() {
    setEditingItem(null)
    setNewUrl('')
    setError('')
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingItem) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/qr/${editingItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drive_folder_url: newUrl }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    closeEditModal()
    router.refresh()
  }

  if (items.length === 0) {
    return (
      <div className="bg-cream border border-dashed border-gold/40 rounded-xl py-12 text-center">
        <p className="text-sm text-brown-muted">생성된 QR 코드가 없습니다.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-cream border border-gold/40 rounded-xl px-4 py-3.5 flex items-center gap-3.5"
          >
            <button
              onClick={() => setDownloadItem(item)}
              aria-label={`${item.products?.name ?? item.slug} QR 코드 다운로드`}
              className="w-12 h-12 bg-white border border-gold/30 rounded-lg flex-shrink-0 flex items-center justify-center hover:opacity-70 transition-opacity"
              title="클릭하여 다운로드"
            >
              <QRCode value={`${baseUrl}/r/${item.slug}`} size={36} />
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brown-dark truncate">
                {item.products?.name ?? '-'}
              </p>
              <p className="text-xs text-brown-light font-mono mt-0.5">
                {item.slug} · {new Date(item.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>

            <div className="flex gap-1.5 flex-shrink-0">
              <Link
                href={`/r/${item.slug}`}
                target="_blank"
                className="text-[10px] px-2.5 py-1 rounded bg-cream-bg text-brown-light border border-gold/30 hover:bg-gold/10 transition-colors"
              >
                미리보기
              </Link>
              <button
                onClick={() => setDownloadItem(item)}
                className="text-[10px] px-2.5 py-1 rounded bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition-colors"
              >
                다운로드
              </button>
              <button
                onClick={() => openEditModal(item)}
                className="text-[10px] px-2.5 py-1 rounded bg-cream-bg text-brown-light border border-gold/30 hover:bg-gold/10 transition-colors"
              >
                URL 변경
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="text-[10px] px-2.5 py-1 rounded bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {downloadItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setDownloadItem(null)}
        >
          <div
            className="bg-cream border border-gold rounded-xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-brown-dark self-start">
              {downloadItem.products?.name ?? downloadItem.slug}
            </h2>
            <QrDisplay
              slug={downloadItem.slug}
              productName={downloadItem.products?.name ?? ''}
            />
            <button
              onClick={() => setDownloadItem(null)}
              className="w-full px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {editingItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeEditModal}
        >
          <div
            className="bg-cream border border-gold rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-brown-dark mb-1">Drive 폴더 URL 변경</h2>
            <p className="text-xs text-brown-light mb-4 font-mono">{editingItem.slug}</p>
            <form onSubmit={handleUpdate} className="flex flex-col gap-3">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
