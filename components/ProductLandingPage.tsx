import type { Product } from '@/lib/types'

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

  const checkItems =
    product.purchase_notes
      ?.split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0) ?? []

  const keywords =
    product.keywords
      ?.split(',')
      .map((kw) => kw.trim())
      .filter((kw) => kw.length > 0) ?? []

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Hero */}
      <div className="bg-cream px-5 pt-8 pb-6">
        {product.description && (
          <p className="text-xs text-brown-mid tracking-wide mb-2">{product.description}</p>
        )}
        <h1 className="text-[32px] font-extrabold text-brown-dark leading-tight tracking-tight mb-4">
          {product.name}
        </h1>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="px-3 py-1 rounded-full bg-gold/10 text-gold text-[11px] font-medium border border-gold/20"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        {/* Primary CTA */}
        {product.idus_url ? (
          <a
            href={product.idus_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gold text-cream text-center font-bold py-4 rounded-2xl text-sm tracking-wide hover:opacity-90 transition-opacity"
          >
            아이디어스에서 구매하기 →
          </a>
        ) : (
          <p className="text-xs text-brown-muted text-center py-2">구매 링크 준비 중입니다</p>
        )}

        {/* Story card */}
        {(product.body || product.quote) && (
          <div className="bg-cream rounded-2xl px-5 py-5">
            <p className="text-[9px] font-bold tracking-[2.5px] text-gold uppercase mb-3">
              작품 소개
            </p>
            {product.body && (
              <p className="text-sm text-brown-dark leading-relaxed">{product.body}</p>
            )}
            {product.quote && (
              <p className="mt-4 text-base font-semibold text-brown-dark leading-snug">
                <span className="text-gold text-xl">&ldquo;</span>
                {product.quote}
                <span className="text-gold text-xl">&rdquo;</span>
              </p>
            )}
          </div>
        )}

        {/* Checklist card */}
        {checkItems.length > 0 && (
          <div className="bg-cream rounded-2xl px-5 py-5">
            <p className="text-[9px] font-bold tracking-[2.5px] text-gold uppercase mb-3">
              구매 전 확인사항
            </p>
            <ul className="flex flex-col gap-2.5">
              {checkItems.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-gold/20 flex-shrink-0 mt-0.5 flex items-center justify-center text-[9px] text-gold font-bold">
                    ✓
                  </span>
                  <span className="text-sm text-brown-dark leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA footer card */}
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
