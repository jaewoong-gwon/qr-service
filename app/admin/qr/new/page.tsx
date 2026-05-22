'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GoldBorderCard } from '@/components/GoldBorderCard'
import { QrDisplay } from '@/components/QrDisplay'
import type { QrCode } from '@/lib/types'

interface CreateResult extends QrCode {
  products: { id: string; name: string } | null
}

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'

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
    <div className="min-h-screen bg-cream-bg">
      <nav className="bg-cream border-b border-gold/30 px-7 py-4 flex items-center gap-4">
        <Link
          href="/admin/dashboard"
          className="text-sm text-brown-light border border-gold/40 rounded-md px-3 py-1.5 hover:bg-gold/10 transition-colors"
        >
          ← 목록
        </Link>
        <div>
          <h1 className="text-base font-bold text-brown-dark">새 QR 코드 생성</h1>
          <span className="text-[9px] tracking-[3px] text-gold">NEW QR CODE</span>
        </div>
      </nav>

      <main className="max-w-[580px] mx-auto px-6 py-7">
        <form onSubmit={handleSubmit}>
          <GoldBorderCard>
            <section className="px-6 py-6">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">기본 정보</p>
              <div>
                <label htmlFor="drive-url" className={labelClass}>
                  Google Drive 폴더 URL <span className="text-gold">*</span>
                </label>
                <input
                  id="drive-url"
                  type="url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className={inputClass}
                  required
                />
                <p className="text-[11px] text-brown-muted mt-1.5">
                  사진이 저장된 공개 Google Drive 폴더 주소를 입력하세요.
                </p>
              </div>
            </section>

            <section className="px-6 py-6 border-t border-gold/20">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">제품 정보</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    제품명 <span className="text-gold">*</span>
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="레진 갓 키링"
                    className={inputClass}
                    required
                  />
                  <p className="text-[11px] text-brown-muted mt-1.5">
                    QR 코드 URL(slug)이 제품명 기반으로 자동 생성됩니다.
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className={labelClass}>
                    설명 <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="price" className={labelClass}>
                      가격 <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
                    </label>
                    <input
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="27,000원"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="materials" className={labelClass}>
                      소재 <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
                    </label>
                    <input
                      id="materials"
                      value={materials}
                      onChange={(e) => setMaterials(e.target.value)}
                      placeholder="레진, 메탈"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dimensions" className={labelClass}>
                    크기 <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
                  </label>
                  <input
                    id="dimensions"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="4.5 × 3.2 cm"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <div className="px-6 py-4 border-t border-gold/20 flex justify-end gap-2.5">
              {error && <p className="text-red-500 text-sm flex-1 self-center">{error}</p>}
              <Link
                href="/admin/dashboard"
                className="px-5 py-2.5 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
              >
                {loading ? '생성 중...' : 'QR 생성'}
              </button>
            </div>
          </GoldBorderCard>
        </form>

        {result && (
          <div className="mt-6">
            <GoldBorderCard className="p-6 flex flex-col items-center gap-4">
              <h2 className="text-base font-bold text-brown-dark self-start">생성된 QR 코드</h2>
              <QrDisplay
                slug={result.slug}
                productName={result.products?.name ?? ''}
              />
            </GoldBorderCard>
          </div>
        )}
      </main>
    </div>
  )
}
