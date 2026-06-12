'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import { Step1Basic, type BasicData } from './steps/Step1Basic'
import { Step2Tags } from './steps/Step2Tags'
import { Step3Sections } from './steps/Step3Sections'
import { Step4Notice } from './steps/Step4Notice'
import { Step5Confirm } from './steps/Step5Confirm'
import type { NoticeFormData } from '@/components/admin/NoticePanel'
import type { Product, ProductTag, ProductSection } from '@/lib/types'

const PREVIEW_SCALE = 0.923
const INNER_W = 390
const INNER_H = 800
const OUTER_W = Math.round(INNER_W * PREVIEW_SCALE)
const OUTER_H = Math.round(INNER_H * PREVIEW_SCALE)

const STEP_LABELS = ['기본 정보', '태그', '섹션', '구매 안내', '확인']

const INITIAL_BASIC: BasicData = { name: '', driveUrl: '', subtitle: '', summary: '', idusUrl: '' }

export default function NewQrPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [basic, setBasic] = useState<BasicData>(INITIAL_BASIC)
  const [tags, setTags] = useState<ProductTag[]>([])
  const [sections, setSections] = useState<ProductSection[]>([])
  const [noticeData, setNoticeData] = useState<NoticeFormData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const previewProduct: Product = {
    id: '',
    qr_code_id: '',
    name: basic.name.trim() || '(제품명)',
    subtitle: basic.subtitle.trim() || null,
    summary: basic.summary.trim() || null,
    idus_url: basic.idusUrl.trim() || null,
    is_active: true,
    product_tags: tags,
    product_sections: sections,
    notice_groups:
      noticeData?.mode === 'new' && noticeData.newGroup
        ? { notice_group_items: noticeData.newGroup.items.map((item, i) => ({ content: item.content, sort_order: i })) }
        : null,
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const body = {
      name: basic.name.trim(),
      drive_folder_url: basic.driveUrl.trim(),
      subtitle: basic.subtitle.trim() || null,
      summary: basic.summary.trim() || null,
      idus_url: basic.idusUrl.trim() || null,
      tags: tags.map((t, i) => ({ label: t.label, sort_order: i })),
      sections: sections.map((s, i) => ({
        section_type: s.section_type,
        title: s.title,
        body: s.body,
        sort_order: i,
        items: s.product_section_items.map((item, j) => ({
          title: item.title,
          description: item.description,
          sort_order: j,
        })),
      })),
      notice: noticeData
        ? {
            group_id: noticeData.mode === 'existing' ? noticeData.groupId : null,
            new_group: noticeData.mode === 'new' ? noticeData.newGroup : null,
          }
        : null,
    }

    const res = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push('/admin/dashboard')
    } else {
      const data = await res.json()
      setError(data.error ?? '생성에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      <nav className="bg-cream border-b border-gold/30 px-8 py-4 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          {/* Step indicator */}
          <div className="flex items-center gap-1.5">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStep(i + 1)}
                  className={`w-6 h-6 rounded-full text-xs font-bold transition-colors ${
                    step === i + 1
                      ? 'bg-gold text-cream'
                      : step > i + 1
                      ? 'bg-gold/30 text-brown-dark'
                      : 'bg-cream-bg text-brown-muted border border-gold/30'
                  }`}
                >
                  {i + 1}
                </button>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`w-4 h-px ${step > i + 1 ? 'bg-gold/50' : 'bg-gold/20'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-8 py-8">
        <div className="flex gap-8 items-start">
          {/* 왼쪽: 단계 폼 */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">
                {STEP_LABELS[step - 1]}
              </p>

              {step === 1 && <Step1Basic data={basic} onChange={setBasic} />}
              {step === 2 && <Step2Tags tags={tags} onChange={setTags} />}
              {step === 3 && <Step3Sections sections={sections} onChange={setSections} />}
              {step === 4 && <Step4Notice noticeData={noticeData} onChange={setNoticeData} />}
              {step === 5 && (
                <Step5Confirm
                  basic={basic}
                  tags={tags}
                  sections={sections}
                  noticeData={noticeData}
                  error={error}
                  loading={loading}
                  onSubmit={handleSubmit}
                />
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="px-5 py-2.5 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 disabled:opacity-30 transition-colors"
              >
                ← 이전
              </button>
              {step < 5 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(5, s + 1))}
                  className="px-6 py-2.5 text-sm bg-gold text-cream font-bold rounded-lg hover:bg-gold/90 transition-colors"
                >
                  다음 →
                </button>
              )}
            </div>
          </div>

          {/* 오른쪽: 실시간 미리보기 */}
          <div className="w-[400px] flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
                실시간 미리보기
              </p>
              <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
                <div
                  className="relative overflow-hidden rounded-[36px] border-4 border-brown-dark/30 shadow-2xl bg-cream-bg"
                  style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px` }}
                >
                  <div
                    className="absolute top-0 left-0"
                    style={{
                      width: `${INNER_W}px`,
                      height: `${INNER_H}px`,
                      transform: `scale(${PREVIEW_SCALE})`,
                      transformOrigin: 'top left',
                      pointerEvents: 'none',
                    }}
                  >
                    <ProductLandingPage product={previewProduct} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
