import type { Product } from '@/lib/types'
import { driveThumbUrl, type DriveImage } from '@/lib/drive'
import { SectionCard } from '@/components/sections/SectionCard'
import { ItemGridCard } from '@/components/sections/ItemGridCard'

interface ProductLandingPageProps {
  product: Product | null
  images?: DriveImage[]
}

export function ProductLandingPage({ product, images = [] }: ProductLandingPageProps) {
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

  const sections = (product.product_sections ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Hero */}
      <div className="bg-cream px-5 pt-8 pb-6 text-center">
        {product.subtitle && (
          <p className="text-xs text-brown-mid tracking-wide mb-2">{product.subtitle}</p>
        )}
        <h1 className="text-[32px] font-extrabold text-brown-dark leading-tight tracking-tight">
          {product.name}
        </h1>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className="text-xs font-medium text-brown-mid bg-cream-bg px-3 py-1 rounded-full border border-gold/30"
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
        {product.summary && (
          <p className="text-sm text-brown-mid mt-3 leading-relaxed">{product.summary}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        {/* 구매 전 확인사항 — 최상단 우선 노출 */}
        {noticeItems.length > 0 && (
          <div className="bg-cream rounded-2xl px-5 py-5">
            <p className="font-bold text-brown-dark text-base mb-4">구매 전 확인사항</p>
            <ul className="flex flex-col gap-3">
              {noticeItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-brown-dark flex-shrink-0 mt-0.5 flex items-center justify-center text-[9px] text-cream font-bold">
                    ✓
                  </span>
                  <span className="text-sm text-brown-dark leading-snug">{item.content}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Drive 이미지 갤러리 */}
        {images.length > 0 && (
          <div className="bg-cream rounded-2xl overflow-hidden">
            <div className="flex gap-2 overflow-x-auto px-3 pt-3 pb-2 scrollbar-hide">
              {images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={driveThumbUrl(img.id, 600)}
                  alt={img.name}
                  className="h-48 w-auto rounded-xl object-cover flex-shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* 동적 섹션: section_type에 따라 카드 분기 */}
        {sections.map((section) => {
          // skip sections with no renderable content
          if (!section.title && !section.body && section.product_section_items.length === 0) {
            return null
          }
          if (
            section.section_type === 'color_meaning' ||
            section.section_type === 'symbol_meaning'
          ) {
            return <ItemGridCard key={section.id} section={section} />
          }
          return <SectionCard key={section.id} section={section} />
        })}

        {/* 아이디어스 CTA */}
        {product.idus_url && (
          <div className="bg-brown-dark/5 rounded-2xl px-5 py-5">
            <p className="text-sm text-brown-mid leading-relaxed mb-4">
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
