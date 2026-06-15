'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import { TagsPanel } from '@/components/admin/TagsPanel'
import { SectionsPanel } from '@/components/admin/SectionsPanel'
import { NoticePanel } from '@/components/admin/NoticePanel'
import { SaveCompleteModal } from '@/components/admin/SaveCompleteModal'
import type { QrCodeWithProduct, Product, ProductTag, ProductSection, NoticeGroup } from '@/lib/types'

interface EditClientProps {
  item: QrCodeWithProduct
  allNoticeGroups: (NoticeGroup & { id: string; name: string })[]
}

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'
const hintClass = 'text-[11px] text-brown-muted font-normal'

const PREVIEW_SCALE = 0.923
const INNER_W = 390
const BORDER_W = 4
const OUTER_W = Math.round(INNER_W * PREVIEW_SCALE) + BORDER_W * 2
const OUTER_H = Math.round(800 * PREVIEW_SCALE) + BORDER_W * 2

const TABS = ['기본 정보', '구매 안내', '태그', '섹션'] as const
type Tab = (typeof TABS)[number]

export function EditClient({ item, allNoticeGroups }: EditClientProps) {
  const router = useRouter()
  const p = item.products
  const [tab, setTab] = useState<Tab>('기본 정보')

  const [name, setName] = useState(p?.name ?? '')
  const [subtitle, setSubtitle] = useState(p?.subtitle ?? '')
  const [summary, setSummary] = useState(p?.summary ?? '')
  const [idusUrl, setIdusUrl] = useState(p?.idus_url ?? '')

  const [tags, setTags] = useState<(ProductTag & { id: string })[]>(
    (p?.product_tags ?? []) as (ProductTag & { id: string })[]
  )
  const [sections, setSections] = useState<ProductSection[]>(p?.product_sections ?? [])
  const [noticeGroupId, setNoticeGroupId] = useState<string | null>(p?.notice_group_id ?? null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showModal, setShowModal] = useState(false)

  const previewProduct: Product = {
    id: p?.id ?? '',
    qr_code_id: item.id,
    name: name.trim() || '(제품명)',
    subtitle: subtitle.trim() || null,
    summary: summary.trim() || null,
    idus_url: idusUrl.trim() || null,
    is_active: p?.is_active ?? true,
    product_tags: tags,
    notice_groups: allNoticeGroups.find((g) => g.id === noticeGroupId) ?? p?.notice_groups ?? null,
    product_sections: sections,
  }

  async function handleSave() {
    if (tab === '기본 정보') {
      setSaving(true)
      setSaveError('')
      const res = await fetch(`/api/qr/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          subtitle: subtitle.trim() || null,
          summary: summary.trim() || null,
          idus_url: idusUrl.trim() || null,
        }),
      })
      setSaving(false)
      if (!res.ok) {
        const data = await res.json()
        setSaveError(data.error ?? '저장에 실패했습니다.')
        return
      }
    }
    setShowModal(true)
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
              <h1 className="text-base font-bold text-brown-dark">제품 정보 수정</h1>
              <span className="text-xs tracking-[2px] text-gold">EDIT PRODUCT</span>
            </div>
          </div>
          {/* 탭 인디케이터 */}
          <div className="flex items-center gap-1.5">
            {TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  tab === t
                    ? 'bg-gold text-cream font-bold'
                    : 'text-brown-light border border-gold/30 hover:bg-gold/10'
                }`}
              >
                {i + 1}. {t}
              </button>
            ))}
          </div>
          <Link
            href={`/r/${item.slug}`}
            target="_blank"
            className="text-sm text-brown-light border border-gold/40 rounded-lg px-4 py-2 hover:bg-gold/10 transition-colors"
          >
            페이지 보기 →
          </Link>
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-8 py-8">
        <div className="flex gap-8 items-start">
          {/* 탭 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">{tab}</p>

              {tab === '기본 정보' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelClass}>
                      제품명 <span className="text-gold">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="레진 갓 키링"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      한 줄 카피 <span className={hintClass}>(상단에 표시)</span>
                    </label>
                    <input
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="전통의 아름다움을 일상 속에"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      요약 <span className={hintClass}>(hero 영역 하단 짧은 문단)</span>
                    </label>
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={2}
                      placeholder="제품에 대한 짧은 요약 문장"
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>아이디어스 구매 링크</label>
                    <input
                      type="url"
                      value={idusUrl}
                      onChange={(e) => setIdusUrl(e.target.value)}
                      placeholder="https://www.idus.com/v2/product/..."
                      className={inputClass}
                    />
                    <p className={`mt-1.5 ${hintClass}`}>없으면 CTA 버튼이 노출되지 않습니다.</p>
                  </div>
                </div>
              )}

              {tab === '구매 안내' && (
                <div>
                  <p className="text-xs text-brown-muted mb-3">
                    공유 그룹 항목 수정 시 해당 그룹을 사용하는 모든 제품에 반영됩니다.
                  </p>
                  <NoticePanel
                    mode="edit"
                    currentGroupId={noticeGroupId}
                    groups={allNoticeGroups}
                    qrId={item.id}
                    onUpdate={setNoticeGroupId}
                  />
                </div>
              )}

              {tab === '태그' && (
                <TagsPanel
                  mode="edit"
                  tags={tags}
                  qrId={item.id}
                  onUpdate={setTags}
                />
              )}

              {tab === '섹션' && (
                <SectionsPanel
                  mode="edit"
                  sections={sections}
                  qrId={item.id}
                  onUpdate={setSections}
                />
              )}

              {/* 저장 버튼 (모든 탭) */}
              <div className="mt-6 pt-4 border-t border-gold/20 flex items-center justify-end gap-3">
                {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm bg-gold text-cream font-bold px-5 py-2 rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>

          {/* 실시간 미리보기 (내부 스크롤) */}
          <div className="w-[400px] flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
                실시간 미리보기
              </p>
              <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
                <div
                  className="overflow-y-auto overflow-x-hidden rounded-[36px] border-4 border-brown-dark/30 shadow-2xl bg-cream-bg [&::-webkit-scrollbar]:hidden"
                  style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px`, scrollbarWidth: 'none' }}
                >
                  <div
                    style={{
                      width: `${INNER_W}px`,
                      zoom: PREVIEW_SCALE,
                      pointerEvents: 'none',
                    }}
                  >
                    <ProductLandingPage product={previewProduct} />
                  </div>
                </div>
                <p className="text-xs text-brown-muted text-center mt-2">
                  입력한 내용이 즉시 반영됩니다
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SaveCompleteModal
        open={showModal}
        title="저장되었습니다 ✓"
        message="변경사항이 저장되었습니다"
        primaryLabel="계속 수정하기"
        onPrimary={() => setShowModal(false)}
        secondaryLabel="홈으로"
        onSecondary={() => router.push('/admin/dashboard')}
      />
    </div>
  )
}
