import { driveThumbUrl } from '@/lib/drive'
import type { FeatureCardsContent } from '@/lib/types'

export function FeatureCardsSection({ content }: { content: FeatureCardsContent }) {
  if (content.cards.length === 0) return null

  return (
    <section className="py-8 border-t border-gold/20">
      <div className="max-w-[480px] mx-auto px-4">
        <h2 className="text-xl font-bold text-brown-dark text-center mb-4">
          {content.heading}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {content.cards.map((card, i) => (
            <div
              key={i}
              className="bg-cream border border-gold/30 rounded-xl p-4 flex flex-col items-center gap-2"
            >
              <img
                src={driveThumbUrl(card.icon_drive_id, 80)}
                alt={card.title}
                className="w-10 h-10 object-contain"
              />
              <p className="text-sm font-bold text-brown-dark text-center">{card.title}</p>
              <p className="text-xs text-brown-light text-center">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}