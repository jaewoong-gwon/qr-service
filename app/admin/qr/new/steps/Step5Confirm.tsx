'use client'

import type { BasicData } from './Step1Basic'
import type { ProductTag, ProductSection } from '@/lib/types'
import type { NoticeFormData } from '@/components/admin/NoticePanel'

const SECTION_TYPE_LABELS: Record<string, string> = {
  meaning: '의미',
  description: '제품 설명',
  color_meaning: '색상별 의미',
  symbol_meaning: '상징별 의미',
  option_story: '옵션 이야기',
  character_story: '캐릭터 이야기',
  place_story: '장소 이야기',
  closing: '마무리 문구',
}

interface Step5Props {
  basic: BasicData
  tags: ProductTag[]
  sections: ProductSection[]
  noticeData: NoticeFormData | null
  error: string
  loading: boolean
  onSubmit: () => void
}

export function Step5Confirm({
  basic,
  tags,
  sections,
  noticeData,
  error,
  loading,
  onSubmit,
}: Step5Props) {
  return (
    <div className="flex flex-col gap-5">
      <Section title="기본 정보">
        <Row label="제품명" value={basic.name || '(없음)'} />
        <Row label="Drive URL" value={basic.driveUrl || '(없음)'} />
        {basic.subtitle && <Row label="한 줄 카피" value={basic.subtitle} />}
        {basic.summary && <Row label="요약" value={basic.summary} />}
        {basic.idusUrl && <Row label="아이디어스 링크" value={basic.idusUrl} />}
      </Section>

      <Section title={`태그 (${tags.length}개)`}>
        {tags.length === 0 ? (
          <p className="text-xs text-brown-muted">없음</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-cream-bg border border-gold/30 rounded-full text-brown-mid"
              >
                {t.label}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title={`섹션 (${sections.length}개)`}>
        {sections.length === 0 ? (
          <p className="text-xs text-brown-muted">없음</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sections.map((s, i) => (
              <li key={i} className="text-xs text-brown-mid">
                {i + 1}. [{SECTION_TYPE_LABELS[s.section_type] ?? s.section_type}]
                {s.title ? ` ${s.title}` : ''}
                {s.product_section_items.length > 0 && ` (아이템 ${s.product_section_items.length}개)`}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="구매 안내">
        {!noticeData ? (
          <p className="text-xs text-brown-muted">없음</p>
        ) : noticeData.mode === 'existing' ? (
          <p className="text-xs text-brown-mid">기존 그룹 연결</p>
        ) : noticeData.newGroup ? (
          <p className="text-xs text-brown-mid">
            새 그룹 생성: {noticeData.newGroup.name} ({noticeData.newGroup.items.length}개 항목)
          </p>
        ) : null}
      </Section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || !basic.name.trim() || !basic.driveUrl.trim()}
        className="w-full py-3 text-sm bg-gold text-cream font-bold rounded-xl hover:bg-gold/90 disabled:opacity-50 transition-colors"
      >
        {loading ? '생성 중...' : '완료 — QR 생성'}
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gold/30 rounded-lg px-4 py-3">
      <p className="text-xs font-bold tracking-[2px] text-gold uppercase mb-2">{title}</p>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-brown-muted w-24 shrink-0">{label}</span>
      <span className="text-brown-dark break-all">{value}</span>
    </div>
  )
}
