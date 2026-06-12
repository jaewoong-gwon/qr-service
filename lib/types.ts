// lib/types.ts — FINAL

export interface QrCode {
  id: string
  slug: string
  drive_folder_url: string
  created_at: string
}

export interface NoticeGroupItem {
  id?: string
  content: string
  sort_order: number
}

export interface NoticeGroup {
  id?: string
  name?: string
  notice_group_items: NoticeGroupItem[]
}

export interface ProductTag {
  id?: string
  label: string
  sort_order: number
}

export interface ProductSectionItem {
  id?: string
  title: string | null
  description: string | null
  sort_order: number
}

export type SectionType =
  | 'meaning'
  | 'description'
  | 'color_meaning'
  | 'symbol_meaning'
  | 'option_story'
  | 'character_story'
  | 'place_story'
  | 'closing'

export interface ProductSection {
  id: string
  section_type: SectionType
  title: string | null
  body: string | null
  sort_order: number
  product_section_items: ProductSectionItem[]
}

export interface Product {
  id: string
  qr_code_id: string
  name: string
  subtitle: string | null
  summary: string | null
  idus_url: string | null
  is_active: boolean
  notice_group_id?: string | null
  product_tags?: ProductTag[]
  notice_groups?: NoticeGroup | null
  product_sections?: ProductSection[]
}

export interface QrCodeWithProduct extends QrCode {
  products: Product | null
}
