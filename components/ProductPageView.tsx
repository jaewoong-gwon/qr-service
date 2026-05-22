'use client'

import { useState } from 'react'
import type { Product } from '@/lib/types'
import type { DriveImage } from '@/lib/drive'
import { driveThumbUrl } from '@/lib/drive'
import { GoldBorderCard } from '@/components/GoldBorderCard'

interface ProductPageViewProps {
  product: Product | null
  images: DriveImage[]
}

export function ProductPageView({ product, images }: ProductPageViewProps) {
  const [selectedImage, setSelectedImage] = useState<DriveImage | null>(null)

  if (!product) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center">
        <p className="text-brown-light">제품 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const heroImage = images[0] ?? null

  return (
    <div className="min-h-screen bg-cream-bg">
      <header className="border-b border-gold/30 py-4 text-center">
        <span className="text-[11px] tracking-[4px] text-gold uppercase">작품 이야기</span>
      </header>

      <main className="max-w-[480px] mx-auto px-4 py-6 space-y-5">
        <GoldBorderCard className="p-5">
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-brown-dark leading-tight">{product.name}</h1>
              <div className="w-7 h-px bg-gold my-3" />
              {product.description && (
                <p className="text-sm text-brown-mid leading-relaxed mb-3">{product.description}</p>
              )}
              {product.price && (
                <p className="text-xl font-bold text-brown-dark">{product.price}</p>
              )}
              {(product.materials || product.dimensions) && (
                <table className="w-full text-sm mt-3">
                  <tbody>
                    {product.materials && (
                      <tr className="border-t border-gold/20">
                        <th className="py-1.5 pr-3 text-left text-brown-light font-normal w-14">소재</th>
                        <td className="py-1.5 text-brown-dark">{product.materials}</td>
                      </tr>
                    )}
                    {product.dimensions && (
                      <tr className="border-t border-gold/20">
                        <th className="py-1.5 pr-3 text-left text-brown-light font-normal w-14">크기</th>
                        <td className="py-1.5 text-brown-dark">{product.dimensions}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {heroImage ? (
              <button
                className="w-[130px] flex-shrink-0"
                onClick={() => setSelectedImage(heroImage)}
              >
                <img
                  src={driveThumbUrl(heroImage.id)}
                  alt={heroImage.name}
                  className="w-full aspect-[3/4] object-cover rounded-lg border border-gold/30"
                />
              </button>
            ) : (
              <div className="w-[130px] h-[173px] flex-shrink-0 bg-cream rounded-lg border border-dashed border-gold/30" />
            )}
          </div>
        </GoldBorderCard>

        {images.length > 0 ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <hr className="flex-1 border-gold/30" />
              <span className="text-[9px] tracking-[3px] text-gold uppercase">Gallery</span>
              <hr className="flex-1 border-gold/30" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className="aspect-square overflow-hidden rounded-md border border-gold/20 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={driveThumbUrl(img.id)}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-cream rounded-lg border border-dashed border-gold/30 py-10 text-center">
            <p className="text-sm text-brown-muted">사진 준비 중입니다.</p>
          </div>
        )}

        <footer className="text-center text-[9px] tracking-[2px] text-gold/60 pb-4">
          © 작품 이야기
        </footer>
      </main>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={driveThumbUrl(selectedImage.id, 2000)}
            alt={selectedImage.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
