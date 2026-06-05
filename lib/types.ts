export interface QrCode {
  id: string
  slug: string
  drive_folder_url: string
  created_at: string
}

export interface Product {
  id: string
  qr_code_id: string
  name: string
  description: string | null
  price: string | null
  materials: string | null
  dimensions: string | null
}

export interface QrCodeWithProduct extends QrCode {
  products: Product | null
}

export type SectionType =
  | 'hero'
  | 'text_block'
  | 'feature_cards'
  | 'specs'
  | 'recommend_list'
  | 'quote'
  | 'photo_section'

export interface HeroContent {
  title: string
  subtitle: string
  body?: string
  image_drive_id?: string
}

export interface TextBlockContent {
  heading: string
  subheading?: string
  body: string
  icon_drive_id?: string
}

export interface FeatureCard {
  icon_drive_id: string
  title: string
  description: string
}

export interface FeatureCardsContent {
  heading: string
  cards: FeatureCard[]
}

export interface SpecsItem {
  image_drive_id: string
  label: string
}

export interface SpecsContent {
  heading: string
  items: SpecsItem[]
  note?: string
}

export interface RecommendListContent {
  heading: string
  items: string[]
}

export interface QuoteContent {
  text: string
  attribution?: string
}

export interface PhotoSectionContent {
  heading?: string
  body?: string
  image_drive_id: string
}

export type SectionContent =
  | HeroContent
  | TextBlockContent
  | FeatureCardsContent
  | SpecsContent
  | RecommendListContent
  | QuoteContent
  | PhotoSectionContent

type ProductSectionBase = {
  id: string
  product_id: string
  display_order: number
  created_at?: string
}

export type ProductSection =
  | (ProductSectionBase & { section_type: 'hero';           content: HeroContent })
  | (ProductSectionBase & { section_type: 'text_block';     content: TextBlockContent })
  | (ProductSectionBase & { section_type: 'feature_cards';  content: FeatureCardsContent })
  | (ProductSectionBase & { section_type: 'specs';          content: SpecsContent })
  | (ProductSectionBase & { section_type: 'recommend_list'; content: RecommendListContent })
  | (ProductSectionBase & { section_type: 'quote';          content: QuoteContent })
  | (ProductSectionBase & { section_type: 'photo_section';  content: PhotoSectionContent })
