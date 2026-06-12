import type { ProductSection } from '@/lib/types'

interface SectionCardProps {
  section: ProductSection
}

export function SectionCard({ section }: SectionCardProps) {
  if (section.section_type === 'closing') {
    return (
      <div className="bg-cream rounded-2xl px-5 py-5 text-center">
        {section.title && (
          <p className="text-xs text-gold font-bold tracking-[2px] uppercase mb-3">{section.title}</p>
        )}
        {section.body && (
          <p className="text-xl font-semibold text-brown-dark leading-snug">
            <span className="text-gold text-3xl leading-none">&ldquo;&nbsp;</span>
            {section.body}
            <span className="text-gold">&rdquo;</span>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-cream rounded-2xl px-5 py-5">
      {section.title && (
        <p className="font-bold text-brown-dark text-base mb-3">{section.title}</p>
      )}
      {section.body && (
        <p className="text-sm text-brown-dark leading-relaxed">{section.body}</p>
      )}
    </div>
  )
}
