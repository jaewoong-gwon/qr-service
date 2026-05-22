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

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">QR Code Manager</h1>
        <div className="flex gap-3 items-center">
          <Link
            href="/admin/qr/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            + 새 QR 생성
          </Link>
          <LogoutButton />
        </div>
      </div>
      <QrTable items={(data as unknown as QrCodeWithProduct[]) ?? []} />
    </main>
  )
}
