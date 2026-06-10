import type { ProductSection, SectionContent, SectionType } from '@/lib/types'
import { HeroForm } from './forms/HeroForm'
import { TextBlockForm } from './forms/TextBlockForm'
import { FeatureCardsForm } from './forms/FeatureCardsForm'
import { SpecsForm } from './forms/SpecsForm'
import { RecommendListForm } from './forms/RecommendListForm'
import { QuoteForm } from './forms/QuoteForm'
import { PhotoSectionForm } from './forms/PhotoSectionForm'

interface SectionFormProps {
  section: ProductSection | null
  sectionType?: SectionType
  onSave: (content: SectionContent) => void
  onCancel: () => void
  loading: boolean
  error: string
}

export function SectionForm({ section, sectionType, onSave, onCancel, loading, error }: SectionFormProps) {
  const type = section?.section_type ?? sectionType!
  const common = { onSave, onCancel, loading, error }

  switch (type) {
    case 'hero':
      return <HeroForm initialContent={section?.section_type === 'hero' ? section.content : { title: '', subtitle: '' }} {...common} />
    case 'text_block':
      return <TextBlockForm initialContent={section?.section_type === 'text_block' ? section.content : { heading: '', body: '' }} {...common} />
    case 'feature_cards':
      return <FeatureCardsForm initialContent={section?.section_type === 'feature_cards' ? section.content : { heading: '', cards: [] }} {...common} />
    case 'specs':
      return <SpecsForm initialContent={section?.section_type === 'specs' ? section.content : { heading: '', items: [] }} {...common} />
    case 'recommend_list':
      return <RecommendListForm initialContent={section?.section_type === 'recommend_list' ? section.content : { heading: '', items: [] }} {...common} />
    case 'quote':
      return <QuoteForm initialContent={section?.section_type === 'quote' ? section.content : { text: '' }} {...common} />
    case 'photo_section':
      return <PhotoSectionForm initialContent={section?.section_type === 'photo_section' ? section.content : { image_drive_id: '' }} {...common} />
    default:
      return null
  }
}
