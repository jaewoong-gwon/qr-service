import type { SectionType } from '@/lib/types'
import { SECTION_TYPE_LABELS } from './sectionTypeLabels'

const SECTION_TYPES: SectionType[] = [
  'hero', 'text_block', 'feature_cards', 'specs', 'recommend_list', 'quote', 'photo_section',
]

interface SectionTypeSelectorProps {
  onSelect: (type: SectionType) => void
}

export function SectionTypeSelector({ onSelect }: SectionTypeSelectorProps) {
  return (
    <div className="bg-cream border border-dashed border-gold/40 rounded-xl p-4">
      <p className="text-[10px] font-bold tracking-[3px] text-gold uppercase mb-3">섹션 추가</p>
      <div className="grid grid-cols-2 gap-2">
        {SECTION_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="px-3 py-2 text-xs text-brown-dark border border-gold/30 rounded-lg hover:bg-gold/10 hover:border-gold/60 transition-colors text-left"
          >
            {SECTION_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  )
}
