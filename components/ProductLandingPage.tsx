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
      <div className="bg-cream px-5 pt-8 pb-6 text-center">
        {product.description && (
          <p className="text-xs text-brown-mid tracking-wide mb-2">{product.description}</p>
        )}
        <h1 className="text-[32px] font-extrabold text-brown-dark leading-tight tracking-tight">
          {product.name}
        </h1>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        {/* 섹션 1: 사진 및 키워드 */}
        {keywords.length > 0 && (
          <div className="bg-cream rounded-2xl py-3.5 px-3">
            <div className="flex items-center divide-x divide-gold/20">
              {keywords.map((kw) => (
                <div key={kw} className="flex-1 flex items-center justify-center px-2 py-1">
                  <span className="text-xs font-medium text-brown-dark text-center leading-snug">
                    {kw}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 섹션 2: 작품 소개 */}
        {(product.body || product.quote) && (
          <div className="bg-cream rounded-2xl px-5 py-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full border border-gold/40 flex items-center justify-center flex-shrink-0">
                <span className="text-gold text-sm">✦</span>
              </div>
              <p className="font-bold text-brown-dark text-base">작품 소개</p>
            </div>
            {product.body && (
              <p className="text-sm text-brown-dark leading-relaxed">{product.body}</p>
            )}
            {product.quote && (
              <p className="mt-5 text-xl font-semibold text-brown-dark leading-snug">
                <span className="text-gold text-3xl leading-none">&ldquo;&nbsp;</span>
                {product.quote}
                <span className="text-gold">&rdquo;</span>
              </p>
            )}
          </div>
        )}

        {/* 섹션 3: 구매 전 확인사항 */}
        {checkItems.length > 0 && (
          <div className="bg-cream rounded-2xl px-5 py-5">
            <p className="font-bold text-brown-dark text-base mb-4">구매 전 확인사항</p>
            <ul className="flex flex-col gap-3">
              {checkItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-brown-dark flex-shrink-0 mt-0.5 flex items-center justify-center text-[9px] text-cream font-bold">
                    ✓
                  </span>
                  <span className="text-sm text-brown-dark leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 섹션 4: 아이디어스 홍보 */}
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
