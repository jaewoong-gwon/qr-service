import { createClient } from '@supabase/supabase-js'
import type { QrCode } from '@/lib/types'

type Database = {
  public: {
    Tables: {
      qr_codes: {
        Row: QrCode
        Insert: Omit<QrCode, 'id' | 'created_at'>
        Update: Partial<Omit<QrCode, 'id' | 'created_at'>>
      }
    }
  }
}

export function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
