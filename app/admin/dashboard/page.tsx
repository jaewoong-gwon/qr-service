// app/admin/dashboard/page.tsx
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { QrTable } from '@/components/QrTable'
import { LogoutButton } from '@/components/LogoutButton'
import type { QrCodeWithProduct } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('qr_codes')
    .select('*, products(*)')
    .order('created_at', { ascending: false })

  const items = (data as unknown as QrCodeWithProduct[]) ?? []

  return (
    <div className="min-h-screen bg-cream-bg">
      <nav className="bg-cream border-b border-gold/30 px-5 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-lg font-bold text-brown-dark block">QR 관리</span>
            <span className="text-[10px] tracking-[2px] text-gold">ADMIN DASHBOARD</span>
          </div>
          <div className="flex gap-2 items-center">
            <Link
              href="/admin/qr/new"
              className="bg-gold text-cream text-sm font-semibold px-4 py-2 rounded-md hover:bg-gold/90 transition-colors"
            >
              + 새 QR 코드
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-5 py-5">
        <div className="flex justify-between items-end mb-4">
          <h1 className="text-2xl font-bold text-brown-dark">QR 코드 목록</h1>
          <span className="text-sm text-brown-light tracking-wide">{items.length} items</span>
        </div>
        <QrTable items={items} />
      </main>
    </div>
  )
}
