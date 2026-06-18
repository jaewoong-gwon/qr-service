// lib/types.ts — FINAL

export interface Store {
  id: string
  admin_id: string
  name: string
  slug: string
  created_at: string
}

export interface QrCode {
  id: string
  slug: string
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

export interface ClosingTemplate {
  id: string
  name: string
  body: string
}

export interface ProductTag {
  id?: string
  label: string
  sort_order: number
}

export type SectionType = 'meaning'

export interface ProductSection {
  id: string
  section_type: SectionType
  title: string | null
  body: string | null
  sort_order: number
}

export interface Product {
  id: string
  qr_code_id: string
  store_id: string | null
  name: string
  subtitle: string | null
  idus_url: string | null
  is_active: boolean
  notice_group_id?: string | null
  closing_template_id?: string | null
  product_tags?: ProductTag[]
  notice_groups?: NoticeGroup | null
  closing_templates?: ClosingTemplate | null
  product_sections?: ProductSection[]
}

export interface QrCodeWithProduct extends QrCode {
  products: Product | null
}
