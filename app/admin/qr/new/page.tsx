'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GoldBorderCard } from '@/components/GoldBorderCard'

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'
const hintClass = 'text-[11px] text-brown-muted font-normal'

export default function NewQrPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [summary, setSummary] = useState('')
  const [idusUrl, setIdusUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        drive_folder_url: driveUrl,
        subtitle: subtitle.trim() || null,
        summary: summary.trim() || null,
        idus_url: idusUrl || null,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      router.push('/admin/dashboard')
    } else {
      setError(data.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      <nav className="bg-cream border-b border-gold/30 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
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
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <form onSubmit={handleSubmit}>
          <GoldBorderCard>
            <section className="px-6 py-6">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">기본 정보</p>
              <div className="flex flex-col gap-4">
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
                  <p className={`mt-1.5 ${hintClass}`}>사진이 저장된 공개 Google Drive 폴더 주소를 입력하세요.</p>
                </div>

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
                </div>

                <div>
                  <label htmlFor="subtitle" className={labelClass}>
                    한 줄 카피 <span className={hintClass}>(선택 · 제품명 위에 표시)</span>
                  </label>
                  <input
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="전통의 아름다움을 일상 속에"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="summary" className={labelClass}>
                    요약 <span className={hintClass}>(선택 · hero 하단)</span>
                  </label>
                  <textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={2}
                    placeholder="제품에 대한 짧은 요약 문장"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div>
                  <label htmlFor="idus-url" className={labelClass}>
                    아이디어스 구매 링크 <span className={hintClass}>(권장)</span>
                  </label>
                  <input
                    id="idus-url"
                    type="url"
                    value={idusUrl}
                    onChange={(e) => setIdusUrl(e.target.value)}
                    placeholder="https://www.idus.com/v2/product/..."
                    className={inputClass}
                  />
                  <p className={`mt-1.5 ${hintClass}`}>없으면 CTA 버튼이 노출되지 않습니다.</p>
                </div>

                <p className={hintClass}>
                  섹션/태그/구매안내는 생성 후 Supabase 대시보드에서 입력하세요.
                </p>
              </div>
            </section>
          </GoldBorderCard>

          <div className="mt-5 flex justify-end items-center gap-3">
            {error && <p className="text-red-500 text-sm mr-auto">{error}</p>}
            <Link
              href="/admin/dashboard"
              className="px-5 py-2.5 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
            >
              {loading ? '생성 중...' : 'QR 생성'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
