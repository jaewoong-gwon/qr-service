import { createClient } from '@supabase/supabase-js'
import type { QrCode, Product, ProductSection } from '@/lib/types'

interface Admin {
  id: string
  admin_id: string
  password_hash: string
  created_at: string
}

type Database = {
  public: {
    Tables: {
      qr_codes: {
        Row: QrCode & Record<string, unknown>
        Insert: Omit<QrCode, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<QrCode, 'id' | 'created_at'>> & Record<string, unknown>
        Relationships: []
      }
      products: {
        Row: Product & Record<string, unknown>
        Insert: Omit<Product, 'id'> & Record<string, unknown>
        Update: Partial<Omit<Product, 'id'>> & Record<string, unknown>
        Relationships: []
      }
      admins: {
        Row: Admin & Record<string, unknown>
        Insert: Omit<Admin, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<Admin, 'id' | 'created_at'>> & Record<string, unknown>
        Relationships: []
      }
      product_sections: {
        Row: ProductSection & Record<string, unknown>
        Insert: Omit<ProductSection, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<ProductSection, 'id' | 'created_at'>> & Record<string, unknown>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
  }
}

export function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
