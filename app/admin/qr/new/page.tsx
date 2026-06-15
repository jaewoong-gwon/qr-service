'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import { Step1Basic, type BasicData } from './steps/Step1Basic'
import { TagsPanel } from '@/components/admin/TagsPanel'
import { SectionsPanel } from '@/components/admin/SectionsPanel'
import { NoticePanel } from '@/components/admin/NoticePanel'
import { SaveCompleteModal } from '@/components/admin/SaveCompleteModal'
import type { NoticeFormData } from '@/components/admin/NoticePanel'
import type { Product, ProductTag, ProductSection, NoticeGroup } from '@/lib/types'

const PREVIEW_SCALE = 0.923
const INNER_W = 390
const OUTER_W = Math.round(INNER_W * PREVIEW_SCALE)
const OUTER_H = Math.round(800 * PREVIEW_SCALE)

const TABS = ['기본 정보', '구매 안내', '태그', '섹션'] as const
type Tab = (typeof TABS)[number]

const INITIAL_BASIC: BasicData = { name: '', subtitle: '', summary: '', idusUrl: '' }

export default function NewQrPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('기본 정보')
  const [basic, setBasic] = useState<BasicData>(INITIAL_BASIC)
  const [tags, setTags] = useState<ProductTag[]>([])
  const [sections, setSections] = useState<ProductSection[]>([])
  const [noticeData, setNoticeData] = useState<NoticeFormData | null>(null)
  const [noticeGroups, setNoticeGroups] = useState<(NoticeGroup & { id: string; name: string })[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch('/api/notice-groups')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setNoticeGroups(data) })
      .catch((err) => console.error('Failed to load notice groups:', err))
  }, [])

  const canCreate = basic.name.trim() !== '' && basic.idusUrl.trim() !== ''

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
        ? {
            notice_group_items: noticeData.newGroup.items.map((item, i) => ({
              content: item.content,
              sort_order: i,
            })),
          }
        : null,
  }

  async function handleCreate() {
    setLoading(true)
    setError('')
    const body = {
      name: basic.name.trim(),
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
      const data = await res.json()
      setCreatedId(data.id)
      setShowModal(true)
    } else {
      const data = await res.json()
      setError(data.error ?? '생성에 실패했습니다.')
    }
    setLoading(false)
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
          {/* QR 생성 버튼 */}
          <div className="flex flex-col items-end gap-1">
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={!canCreate || loading}
              className="text-sm bg-gold text-cream font-bold px-5 py-2 rounded-lg hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '생성 중...' : 'QR 생성'}
            </button>
            {!canCreate && (
              <p className="text-[10px] text-brown-muted">제품명·아이디어스 링크 입력 후 활성화</p>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-8 py-8">
        <div className="flex gap-8 items-start">
          {/* 탭 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="bg-cream border border-gold/40 rounded-xl px-6 py-6">
              <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-5">{tab}</p>
              {tab === '기본 정보' && <Step1Basic data={basic} onChange={setBasic} />}
              {tab === '구매 안내' && (
                <div>
                  <p className="text-xs text-brown-muted mb-4">
                    구매 전 확인사항을 그룹으로 관리합니다. 여러 제품이 같은 그룹을 공유할 수 있습니다.
                  </p>
                  <NoticePanel
                    mode="create"
                    noticeData={noticeData}
                    groups={noticeGroups}
                    onChange={setNoticeData}
                  />
                </div>
              )}
              {tab === '태그' && (
                <div>
                  <p className="text-xs text-brown-muted mb-4">
                    태그는 hero 영역에 pill 형태로 표시됩니다. 예: #레진 #한국전통 #키링
                  </p>
                  <TagsPanel mode="create" tags={tags} onChange={setTags} />
                </div>
              )}
              {tab === '섹션' && (
                <div>
                  <p className="text-xs text-brown-muted mb-4">
                    섹션은 랜딩 페이지 본문에 순서대로 표시됩니다.
                  </p>
                  <SectionsPanel mode="create" sections={sections} onChange={setSections} />
                </div>
              )}
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
                  className="overflow-y-auto overflow-x-hidden rounded-[36px] border-4 border-brown-dark/30 shadow-2xl bg-cream-bg"
                  style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px` }}
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
              </div>
            </div>
          </div>
        </div>
      </main>

      <SaveCompleteModal
        open={showModal}
        title="생성되었습니다 ✓"
        message="QR 코드가 생성되었습니다"
        primaryLabel="수정 계속하기"
        onPrimary={() => { if (createdId) router.push(`/admin/qr/${createdId}/edit`) }}
        secondaryLabel="홈으로"
        onSecondary={() => router.push('/admin/dashboard')}
      />
    </div>
  )
}
