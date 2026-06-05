import { driveThumbUrl } from '@/lib/drive'
import type { SpecsContent } from '@/lib/types'

export function SpecsSection({ content }: { content: SpecsContent }) {
  if (content.items.length === 0) return null

  return (
    <section className="py-8 border-t border-gold/20">
      <div className="max-w-[480px] mx-auto px-4">
        <h2 className="text-xl font-bold text-brown-dark text-center mb-4">
          {content.heading}
        </h2>
        <div className="flex flex-col gap-4">
          {content.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <img
                src={driveThumbUrl(item.image_drive_id, 200)}
                alt={item.label}
                className="w-24 h-24 object-cover rounded-lg border border-gold/20 flex-shrink-0"
              />
              <p className="text-sm font-bold text-brown-dark">{item.label}</p>
            </div>
          ))}
        </div>
        {content.note && (
          <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 text-xs text-brown-mid mt-4">
            {content.note}
          </div>
        )}
      </div>
    </section>
  )
}