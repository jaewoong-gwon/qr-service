'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import { QrDisplay } from '@/components/QrDisplay'
import type { QrCode } from '@/lib/types'

interface QrTableProps {
  items: QrCode[]
}

export function QrTable({ items }: QrTableProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  const router = useRouter()

  const [editingItem, setEditingItem] = useState<QrCode | null>(null)
  const [downloadItem, setDownloadItem] = useState<QrCode | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDelete(item: QrCode) {
    if (!confirm(`"${item.product_name}" QR 코드를 삭제하시겠습니까?`)) return

    const res = await fetch(`/api/qr/${item.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    }
  }

  function openEditModal(item: QrCode) {
    setEditingItem(item)
    setNewUrl(item.drive_url)
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
      body: JSON.stringify({ drive_url: newUrl }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    closeEditModal()
    router.refresh()
  }

  if (items.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        생성된 QR 코드가 없습니다.
      </p>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium">제품명</th>
              <th className="text-left p-3 font-medium">Slug</th>
              <th className="text-left p-3 font-medium">생성일</th>
              <th className="text-left p-3 font-medium">QR</th>
              <th className="text-left p-3 font-medium">액션</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{item.product_name}</td>
                <td className="p-3 font-mono">{item.slug}</td>
                <td className="p-3 text-gray-500">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="p-3">
                  <QRCode value={`${baseUrl}/r/${item.slug}`} size={64} />
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDownloadItem(item)}
                      className="px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    >
                      다운로드
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      URL 변경
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="px-3 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {downloadItem && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setDownloadItem(null)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold self-start">{downloadItem.product_name}</h2>
            <QrDisplay slug={downloadItem.slug} productName={downloadItem.product_name} />
            <button
              onClick={() => setDownloadItem(null)}
              className="w-full px-4 py-2 text-sm rounded border hover:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {editingItem && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={closeEditModal}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-1">Drive URL 변경</h2>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-mono">{editingItem.slug}</span> — QR 코드 주소는 유지됩니다
            </p>
            <form onSubmit={handleUpdate} className="flex flex-col gap-3">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm rounded border hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
