import type { ProductSection } from '@/lib/types'
import { HeroSection } from './sections/HeroSection'
import { TextBlockSection } from './sections/TextBlockSection'
import { FeatureCardsSection } from './sections/FeatureCardsSection'
import { SpecsSection } from './sections/SpecsSection'
import { RecommendListSection } from './sections/RecommendListSection'
import { QuoteSection } from './sections/QuoteSection'
import { PhotoSection } from './sections/PhotoSection'

interface ProductDetailViewProps {
  sections: ProductSection[]
}

export function ProductDetailView({ sections }: ProductDetailViewProps) {
  return (
    <div className="min-h-screen bg-cream-bg">
      <header className="border-b border-gold/30 py-4 text-center">
        <span className="text-[11px] tracking-[4px] text-gold uppercase">작품 이야기</span>
      </header>
      <main>
        {sections.map((section) => {
          switch (section.section_type) {
            case 'hero':
              return <HeroSection key={section.id} content={section.content} />
            case 'text_block':
              return <TextBlockSection key={section.id} content={section.content} />
            case 'feature_cards':
              return <FeatureCardsSection key={section.id} content={section.content} />
            case 'specs':
              return <SpecsSection key={section.id} content={section.content} />
            case 'recommend_list':
              return <RecommendListSection key={section.id} content={section.content} />
            case 'quote':
              return <QuoteSection key={section.id} content={section.content} />
            case 'photo_section':
              return <PhotoSection key={section.id} content={section.content} />
          }
        })}
      </main>
      <footer className="text-center text-[9px] tracking-[2px] text-gold/60 py-6">
        © 작품 이야기
      </footer>
    </div>
  )
}