import type { Product } from '@/lib/types'

interface ProductLandingPageProps {
  product: Product | null
}

export function ProductLandingPage({ product }: ProductLandingPageProps) {
  return (
    <div className="min-h-screen bg-cream-bg pb-24">
      <header className="border-b border-gold/30 py-3 text-center">
        <span className="text-[10px] tracking-[4px] text-gold uppercase">작품 이야기</span>
      </header>

      <main className="max-w-[480px] mx-auto px-5">
        <h1 className="mt-5 text-2xl font-bold text-brown-dark">
          {product?.name ?? '제품 정보 없음'}
        </h1>
        <div className="w-12 h-px bg-gold/60 mt-3 mb-4" />

        {product?.description && (
          <p className="text-sm text-brown-mid leading-relaxed">{product.description}</p>
        )}

        {product?.purchase_notes && (
          <div className="mt-6 bg-cream border border-gold/20 rounded-xl p-4">
            <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-3">
              구매 전 확인사항
            </p>
            <p className="text-sm text-brown-mid leading-relaxed whitespace-pre-line">
              {product.purchase_notes}
            </p>
          </div>
        )}

        {product?.idus_url ? (
          <p className="mt-5 text-xs text-brown-muted text-center">
            아이디어스(idus)에서 판매 중입니다
          </p>
        ) : (
          <p className="mt-6 text-xs text-brown-muted text-center">구매 링크 준비 중입니다</p>
        )}
      </main>

      {product?.idus_url && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-cream-bg/95 backdrop-blur-sm border-t border-gold/20">
          <a
            href={product.idus_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full max-w-[480px] mx-auto bg-gold text-cream text-center font-bold py-3.5 rounded-xl text-sm tracking-wide hover:bg-gold/90 transition-colors"
          >
            아이디어스에서 구매하기 →
          </a>
        </div>
      )}
    </div>
  )
}
