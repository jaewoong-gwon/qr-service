import type { Product } from '@/lib/types'

interface ProductLandingPageProps {
  product: Product | null
}

export function ProductLandingPage({ product }: ProductLandingPageProps) {
  const checkItems =
    product?.purchase_notes
      ?.split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0) ?? []

  return (
    <div className="min-h-screen bg-cream-bg">
      <header className="border-b border-gold/20 px-5 py-3 flex items-center gap-3">
        <span className="text-[9px] font-bold tracking-[2.5px] text-gold uppercase">
          작품 이야기
        </span>
        <div className="w-px h-3 bg-brown-light/30" />
        <span className="text-[9px] text-brown-light/60 truncate">
          {product?.name ?? ''}
        </span>
      </header>

      <main className="max-w-[480px] mx-auto px-5 py-6">
        <h1 className="text-[26px] font-extrabold text-brown-dark leading-tight tracking-tight mb-2">
          {product?.name ?? '제품 정보 없음'}
        </h1>

        {product?.description && (
          <p className="text-sm text-brown-mid leading-relaxed mb-6">
            {product.description}
          </p>
        )}

        {product?.idus_url ? (
          <a
            href={product.idus_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gold text-cream text-center font-bold py-3.5 rounded-xl text-sm tracking-wide hover:opacity-90 transition-opacity mb-8"
          >
            아이디어스에서 구매하기 →
          </a>
        ) : (
          <p className="text-xs text-brown-muted text-center mb-8">구매 링크 준비 중입니다</p>
        )}

        {checkItems.length > 0 && (
          <div>
            <hr className="border-gold/20 mb-4" />
            <p className="text-[9px] font-bold tracking-[2.5px] text-gold uppercase mb-4">
              구매 전 확인사항
            </p>
            <ul className="flex flex-col gap-2.5">
              {checkItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 border border-gold/60 rounded flex-shrink-0 mt-0.5 flex items-center justify-center text-[10px] text-gold font-bold">
                    ✓
                  </span>
                  <span className="text-sm text-brown-dark leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {product?.idus_url && (
          <div className="mt-8 pt-5 border-t border-gold/20 text-center">
            <a
              href={product.idus_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gold underline underline-offset-2"
            >
              아이디어스에서 자세히 보기
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
