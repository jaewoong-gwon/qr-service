import type { ProductSection } from '@/lib/types'

interface SectionCardProps {
  section: ProductSection
}

export function SectionCard({ section }: SectionCardProps) {
  const paragraphs = section.body ? section.body.split('\n').filter(Boolean) : []

  return (
    <div className="bg-cream rounded-2xl px-5 py-5">
      {section.title && (
        <p className="text-[13px] font-bold text-brown-dark border-l-[3px] border-gold pl-[9px] mb-[10px] leading-snug">
          {section.title}
        </p>
      )}
      {paragraphs.length > 0 && (
        <div className="flex flex-col gap-2">
          {paragraphs.map((p, i) => (
            <div key={i} className="bg-cream-bg rounded-xl px-4 py-3">
              <p className="text-[14px] text-brown-dark leading-[1.75]">{p}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
