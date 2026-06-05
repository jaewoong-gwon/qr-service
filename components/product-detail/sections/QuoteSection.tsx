import type { QuoteContent } from '@/lib/types'

export function QuoteSection({ content }: { content: QuoteContent }) {
  return (
    <section className="py-8 border-t border-b border-gold/30 bg-cream">
      <div className="max-w-[480px] mx-auto px-4 text-center">
        <span className="text-4xl text-gold/40 leading-none">"</span>
        <p className="text-base text-brown-mid leading-relaxed -mt-2">
          {content.text}
        </p>
        <span className="text-4xl text-gold/40 leading-none">"</span>
        {content.attribution && (
          <p className="text-xs text-brown-light mt-2">{content.attribution}</p>
        )}
      </div>
    </section>
  )
}