'use client'

import { useState } from 'react'
import type { Product } from '@/lib/types'
import type { DriveImage } from '@/lib/drive'

interface ProductPageViewProps {
  product: Product | null
  images: DriveImage[]
}

export function ProductPageView({ product, images }: ProductPageViewProps) {
  const [selectedImage, setSelectedImage] = useState<DriveImage | null>(null)

  if (!product) {
    return (
      <main className="max-w-2xl mx-auto p-8 text-center text-gray-500">
        제품 정보를 찾을 수 없습니다.
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{product.name}</h1>

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className="aspect-square overflow-hidden rounded"
            >
              <img
                src={img.thumbnailLink}
                alt={img.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400 mb-6">
          사진 준비 중입니다.
        </div>
      )}

      {product.description && (
        <p className="text-gray-700 mb-6 whitespace-pre-wrap">{product.description}</p>
      )}

      {(product.price || product.materials || product.dimensions) && (
        <table className="w-full text-sm border-t">
          <tbody>
            {product.price && (
              <tr className="border-b">
                <th className="py-2 pr-4 text-left text-gray-500 w-20 font-medium">가격</th>
                <td className="py-2">{product.price}</td>
              </tr>
            )}
            {product.materials && (
              <tr className="border-b">
                <th className="py-2 pr-4 text-left text-gray-500 w-20 font-medium">소재</th>
                <td className="py-2">{product.materials}</td>
              </tr>
            )}
            {product.dimensions && (
              <tr className="border-b">
                <th className="py-2 pr-4 text-left text-gray-500 w-20 font-medium">크기</th>
                <td className="py-2">{product.dimensions}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage.webContentLink}
            alt={selectedImage.name}
            className="max-w-full max-h-full object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  )
}
