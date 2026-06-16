// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { QrCode, Product } from '@/lib/types'

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
        Insert: Omit<Product, 'id' | 'product_tags' | 'notice_groups' | 'product_sections'> & Record<string, unknown>
        Update: Partial<Omit<Product, 'id' | 'product_tags' | 'notice_groups' | 'product_sections'>> & Record<string, unknown>
        Relationships: []
      }
      notice_groups: {
        Row: { id: string; name: string } & Record<string, unknown>
        Insert: { name: string } & Record<string, unknown>
        Update: Partial<{ name: string }> & Record<string, unknown>
        Relationships: []
      }
      notice_group_items: {
        Row: { id: string; notice_group_id: string; content: string; sort_order: number } & Record<string, unknown>
        Insert: { notice_group_id: string; content: string; sort_order?: number } & Record<string, unknown>
        Update: Partial<{ content: string; sort_order: number }> & Record<string, unknown>
        Relationships: []
      }
      product_tags: {
        Row: { id: string; product_id: string; label: string; sort_order: number } & Record<string, unknown>
        Insert: { product_id: string; label: string; sort_order?: number } & Record<string, unknown>
        Update: Partial<{ label: string; sort_order: number }> & Record<string, unknown>
        Relationships: []
      }
      product_sections: {
        Row: { id: string; product_id: string; section_type: string; title: string | null; body: string | null; sort_order: number } & Record<string, unknown>
        Insert: { product_id: string; section_type: string; title?: string | null; body?: string | null; sort_order?: number } & Record<string, unknown>
        Update: Partial<{ section_type: string; title: string | null; body: string | null; sort_order: number }> & Record<string, unknown>
        Relationships: []
      }
      admins: {
        Row: Admin & Record<string, unknown>
        Insert: Omit<Admin, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<Admin, 'id' | 'created_at'>> & Record<string, unknown>
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
