'use client'

import { useState } from 'react'
import Link from 'next/link'
import { QrDisplay } from '@/components/QrDisplay'
import type { QrCode } from '@/lib/types'

interface CreateResult extends QrCode {
  products: { id: string; name: string } | null
}

export default function NewQrPage() {
  const [name, setName] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [materials, setMaterials] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [result, setResult] = useState<CreateResult | null>(null)
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
      body: JSON.stringify({
        name,
        drive_folder_url: driveUrl,
        description: description || null,
        price: price || null,
        materials: materials || null,
        dimensions: dimensions || null,
      }),
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
          <label htmlFor="name" className="block text-sm font-medium mb-1">제품명</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="drive-url" className="block text-sm font-medium mb-1">
            Google Drive 폴더 URL
          </label>
          <input
            id="drive-url"
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            설명 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-1">
              가격 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="₩15,000"
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="materials" className="block text-sm font-medium mb-1">
              소재 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              id="materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="면 100%"
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="dimensions" className="block text-sm font-medium mb-1">
              크기 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              id="dimensions"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              placeholder="20×15cm"
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
          <QrDisplay
            slug={result.slug}
            productName={result.products?.name ?? ''}
          />
        </div>
      )}
    </main>
  )
}
