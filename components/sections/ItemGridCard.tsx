import type { ProductSection } from '@/lib/types'

interface ItemGridCardProps {
  section: ProductSection
}

export function ItemGridCard({ section }: ItemGridCardProps) {
  const items = section.product_section_items
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="bg-cream rounded-2xl px-5 py-5">
      {section.title && (
        <p className="font-bold text-brown-dark text-base mb-4">{section.title}</p>
      )}
      {section.body && (
        <p className="text-sm text-brown-dark leading-relaxed mb-4">{section.body}</p>
      )}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => (
            <div key={i} className="bg-cream-bg rounded-xl px-3 py-3">
              {item.title && (
                <p className="text-xs font-bold text-gold mb-1">{item.title}</p>
              )}
              {item.description && (
                <p className="text-xs text-brown-dark leading-snug">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
