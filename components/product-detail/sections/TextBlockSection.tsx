import { driveThumbUrl } from '@/lib/drive'
import type { TextBlockContent } from '@/lib/types'

export function TextBlockSection({ content }: { content: TextBlockContent }) {
  return (
    <section className="py-8 border-t border-gold/20">
      <div className="max-w-[480px] mx-auto px-4 text-center">
        {content.icon_drive_id && (
          <img
            src={driveThumbUrl(content.icon_drive_id, 64)}
            alt="icon"
            className="w-8 h-8 object-contain mx-auto mb-3"
          />
        )}
        {content.subheading && (
          <p className="text-[10px] tracking-[3px] text-gold uppercase mb-2">
            {content.subheading}
          </p>
        )}
        <h2 className="text-2xl font-bold text-brown-dark">{content.heading}</h2>
        <div className="w-8 h-px bg-gold mx-auto my-3" />
        <p className="text-sm text-brown-mid leading-relaxed">{content.body}</p>
      </div>
    </section>
  )
}