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

export interface ProductSection {
  id: string
  product_id: string
  section_type: SectionType
  display_order: number
  content: SectionContent
}
