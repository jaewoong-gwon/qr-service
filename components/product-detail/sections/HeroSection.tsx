import { driveThumbUrl } from '@/lib/drive'
import type { HeroContent } from '@/lib/types'

export function HeroSection({ content }: { content: HeroContent }) {
  return (
    <section className="py-8">
      <div className="max-w-[480px] mx-auto px-4">
        {content.image_drive_id && (
          <img
            src={driveThumbUrl(content.image_drive_id, 800)}
            alt={content.title}
            className="w-full rounded-xl border border-gold/20 mb-6"
          />
        )}
        <p className="text-[10px] tracking-[3px] text-gold uppercase mb-2">
          {content.subtitle}
        </p>
        <h1 className="text-3xl font-bold text-brown-dark leading-tight">
          {content.title}
        </h1>
        {content.body && (
          <p className="text-sm text-brown-mid leading-relaxed mt-3">
            {content.body}
          </p>
        )}
      </div>
    </section>
  )
}