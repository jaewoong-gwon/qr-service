import type { RecommendListContent } from '@/lib/types'

export function RecommendListSection({ content }: { content: RecommendListContent }) {
  if (content.items.length === 0) return null

  return (
    <section className="py-8 border-t border-gold/20">
      <div className="max-w-[480px] mx-auto px-4">
        <h2 className="text-xl font-bold text-brown-dark">{content.heading}</h2>
        <div className="w-8 h-px bg-gold my-3" />
        <ul className="flex flex-col gap-2">
          {content.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-gold text-base leading-snug flex-shrink-0">›</span>
              <span className="text-sm text-brown-mid">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}