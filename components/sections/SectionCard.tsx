import type { ProductSection } from '@/lib/types'

interface SectionCardProps {
  section: ProductSection
}

export function SectionCard({ section }: SectionCardProps) {
  return (
    <div className="bg-cream rounded-2xl px-5 py-5">
      {section.title && (
        <p className="text-[13px] font-bold text-brown-dark border-l-[3px] border-gold pl-[9px] mb-[10px] leading-snug">
          {section.title}
        </p>
      )}
      {section.body && (
        <p className="text-[14px] text-brown-dark leading-[1.75]">{section.body}</p>
      )}
    </div>
  )
}
