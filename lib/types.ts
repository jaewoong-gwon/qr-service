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
  idus_url: string | null
  purchase_notes: string | null
}

export interface QrCodeWithProduct extends QrCode {
  products: Product | null
}

