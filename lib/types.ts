// lib/types.ts

export interface QrCode {
  id: string
  slug: string
  drive_folder_url: string
  created_at: string
}

export interface NoticeGroupItem {
  content: string
  sort_order: number
}

export interface NoticeGroup {
  notice_group_items: NoticeGroupItem[]
}

export interface ProductTag {
  label: string
  sort_order: number
}

export interface ProductSectionItem {
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
  // New fields — optional here for backward compat; made required in Task 4
  subtitle?: string | null
  summary?: string | null
  is_active?: boolean
  idus_url?: string | null
  // New optional join fields (populated by nested select queries)
  product_tags?: ProductTag[]
  notice_groups?: NoticeGroup | null
  product_sections?: ProductSection[]
  // Deprecated: preserved until manual data migration; removed in Task 4
  /** @deprecated use subtitle */
  description?: string | null
  /** @deprecated use product_sections */
  keywords?: string | null
  /** @deprecated use product_sections */
  body?: string | null
  /** @deprecated use product_sections (closing section) */
  quote?: string | null
  /** @deprecated use notice_groups */
  purchase_notes?: string | null
}

export interface QrCodeWithProduct extends QrCode {
  products: Product | null
}
