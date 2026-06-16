import type { ProductSection } from '@/lib/types'

interface SectionCardProps {
  section: ProductSection
}

export function SectionCard({ section }: SectionCardProps) {
  if (section.section_type === 'closing') {
    return (
      <div className="bg-cream rounded-2xl px-5 py-6 text-center">
        {section.title && (
          <p className="text-[10px] text-gold font-bold tracking-[2px] uppercase mb-3">{section.title}</p>
        )}
        {section.body && (
          <p className="text-[17px] font-bold text-brown-dark leading-[1.7]">
            {section.body}
          </p>
        )}
      </div>
    )
  }

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
