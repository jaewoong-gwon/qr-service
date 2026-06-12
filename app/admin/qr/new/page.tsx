'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GoldBorderCard } from '@/components/GoldBorderCard'

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'

export default function NewQrPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [description, setDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [body, setBody] = useState('')
  const [quote, setQuote] = useState('')
  const [idusUrl, setIdusUrl] = useState('')
  const [purchaseNotes, setPurchaseNotes] = useState('')
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
        description: description.trim() || null,
        keywords: keywords.trim() || null,
        body: body.trim() || null,
        quote: quote.trim() || null,
        idus_url: idusUrl || null,
        purchase_notes: purchaseNotes || null,
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
                </div>

                <div>
                  <label htmlFor="description" className={labelClass}>
                    한 줄 카피{' '}
                    <span className="text-[11px] text-brown-muted font-normal">(선택 · 제품명 위에 표시)</span>
                  </label>
                  <input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="전통의 아름다움을 일상 속에"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="keywords" className={labelClass}>
                    키워드{' '}
                    <span className="text-[11px] text-brown-muted font-normal">(선택 · 쉼표로 구분)</span>
                  </label>
                  <input
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="전통 소품,핸드메이드,선물 추천"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="px-6 py-6 border-t border-gold/20">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">랜딩 페이지</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="body" className={labelClass}>
                    소개 본문{' '}
                    <span className="text-[11px] text-brown-muted font-normal">(선택)</span>
                  </label>
                  <textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    placeholder="작품에 담긴 이야기를 2-3줄로 소개해주세요"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div>
                  <label htmlFor="quote" className={labelClass}>
                    강조 문장{' '}
                    <span className="text-[11px] text-brown-muted font-normal">(선택 · 큰따옴표로 강조 표시)</span>
                  </label>
                  <input
                    id="quote"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="작지만 오래 간직할 수 있는 전통의 가치"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="idus-url" className={labelClass}>
                    아이디어스 구매 링크{' '}
                    <span className="text-[11px] text-brown-muted font-normal">(권장)</span>
                  </label>
                  <input
                    id="idus-url"
                    type="url"
                    value={idusUrl}
                    onChange={(e) => setIdusUrl(e.target.value)}
                    placeholder="https://www.idus.com/v2/product/..."
                    className={inputClass}
                  />
                  <p className="text-[11px] text-brown-muted mt-1.5">
                    없으면 구매 버튼이 노출되지 않습니다.
                  </p>
                </div>

                <div>
                  <label htmlFor="purchase-notes" className={labelClass}>
                    구매 전 확인사항{' '}
                    <span className="text-[11px] text-brown-muted font-normal">(선택 · 줄바꿈으로 항목 구분)</span>
                  </label>
                  <textarea
                    id="purchase-notes"
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                    rows={4}
                    placeholder={"핸드메이드 제품으로 색상·크기에 차이가 있을 수 있습니다\n사진과 실물 색상이 다를 수 있습니다"}
                    className={`${inputClass} resize-none`}
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
      </main>
    </div>
  )
}
