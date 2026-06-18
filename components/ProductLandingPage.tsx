import type { Product, ProductSection } from '@/lib/types'
import { SectionCard } from '@/components/sections/SectionCard'

interface ProductLandingPageProps {
  product: Product | null
}

export function ProductLandingPage({ product }: ProductLandingPageProps) {
  if (!product) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center">
        <p className="text-brown-mid">제품 정보 없음</p>
      </div>
    )
  }

  const noticeItems = (product.notice_groups?.notice_group_items ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  const tags = (product.product_tags ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  // product_content_links를 SectionCard 형태로 변환 (sort_order 오름차순)
  const contentLinkSections: ProductSection[] = (product.product_content_links ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((link) => ({
      id: link.id,
      section_type: 'meaning' as const,
      title: link.content_library.title,
      body: link.content_library.body,
      sort_order: link.sort_order,
    }))

  const sections = (product.product_sections ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  const closingBody = product.closing_templates?.body ?? null

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Hero */}
      <div className="bg-cream px-5 pt-8 pb-6 text-center">
        {product.subtitle && (
          <p className="text-[10px] text-brown-muted tracking-[1.5px] uppercase font-medium mb-2">{product.subtitle}</p>
        )}
        <h1 className="text-[28px] font-black text-brown-dark leading-[1.15] tracking-[-0.5px]">
          {product.name}
        </h1>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className="text-[11px] font-semibold text-brown-mid bg-cream-bg px-3 py-[5px] rounded-full border border-gold/30"
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* 구매 전 확인사항 — 최상단 우선 노출 */}
        {noticeItems.length > 0 && (
          <div className="bg-gold/[0.07] border border-gold/20 border-l-[3px] border-l-gold rounded-xl px-4 py-4">
            <p className="text-[13px] font-bold text-brown-dark mb-3 flex items-center gap-1.5">
              <span aria-hidden="true">📋</span> 구매 전 확인사항
            </p>
            <ul className="flex flex-col gap-2.5">
              {noticeItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-gold flex-shrink-0 mt-0.5 flex items-center justify-center text-[8px] text-cream font-bold">
                    ✓
                  </span>
                  <span className="text-[13px] text-brown-dark leading-[1.65]">{item.content}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 공유 콘텐츠 (content_library 연결 항목) — product_sections보다 먼저 */}
        {contentLinkSections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}

        {/* 제품 고유 섹션 (meaning 타입) */}
        {sections.map((section) => {
          if (!section.title && !section.body) return null
          return <SectionCard key={section.id} section={section} />
        })}

        {/* 마무리 문구 — closing_template에서 고정 출력 */}
        {closingBody && (
          <div className="bg-cream rounded-2xl px-5 py-6 text-center">
            <p className="text-[17px] font-bold text-brown-dark leading-[1.7]">
              {closingBody}
            </p>
          </div>
        )}

        {/* 아이디어스 CTA */}
        {product.idus_url && (
          <div className="bg-brown-dark/5 rounded-2xl px-5 py-5">
            <p className="text-[13px] text-brown-dark leading-[1.75] mb-4">
              더 많은 작품 사진과 자세한 설명은{' '}
              <span className="text-gold font-semibold">아이디어스</span>에서 확인하실 수 있습니다.
            </p>
            <a
              href={product.idus_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-brown-dark text-cream text-center font-bold py-4 rounded-xl text-sm tracking-wide hover:opacity-90 transition-opacity"
            >
              아이디어스 작품 페이지 보기 →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
