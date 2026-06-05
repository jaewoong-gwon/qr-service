'use client'

import { useState } from 'react'
import { driveThumbUrl } from '@/lib/drive'
import type { PhotoSectionContent } from '@/lib/types'

export function PhotoSection({ content }: { content: PhotoSectionContent }) {
  const [lightbox, setLightbox] = useState(false)

  return (
    <section className="py-8 border-t border-gold/20">
      <div className="max-w-[480px] mx-auto px-4">
        {content.heading && (
          <h2 className="text-xl font-bold text-brown-dark">{content.heading}</h2>
        )}
        {content.body && (
          <p className="text-sm text-brown-mid leading-relaxed mt-2">{content.body}</p>
        )}
        <button
          onClick={() => setLightbox(true)}
          className="w-full mt-4"
          aria-label="이미지 크게 보기"
        >
          <img
            src={driveThumbUrl(content.image_drive_id, 800)}
            alt={content.heading ?? 'image'}
            className="w-full rounded-xl border border-gold/20"
          />
        </button>
      </div>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setLightbox(false) }}
          tabIndex={-1}
        >
          <img
            src={driveThumbUrl(content.image_drive_id, 2000)}
            alt={content.heading ?? 'image'}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}