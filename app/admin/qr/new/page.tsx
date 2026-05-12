'use client'

import { useState } from 'react'
import Link from 'next/link'
import { QrDisplay } from '@/components/QrDisplay'
import type { QrCode } from '@/lib/types'

export default function NewQrPage() {
  const [productName, setProductName] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [result, setResult] = useState<QrCode | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_name: productName, drive_url: driveUrl }),
    })

    const data = await res.json()
    if (res.ok) {
      setResult(data)
    } else {
      setError(data.error)
    }
    setLoading(false)
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <Link href="/admin/dashboard" className="text-blue-600 hover:underline text-sm">
        ← 목록으로
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">새 QR 코드 생성</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">제품명</label>
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Google Drive URL</label>
          <input
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '생성 중...' : 'QR 생성'}
        </button>
      </form>

      {result && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">생성된 QR 코드</h2>
          <QrDisplay slug={result.slug} productName={result.product_name} />
        </div>
      )}
    </main>
  )
}
