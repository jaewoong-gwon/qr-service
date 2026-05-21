import { createClient } from '@supabase/supabase-js'
import type { QrCode } from '@/lib/types'

interface Admin {
  id: string
  email: string
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
