import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SectionList } from '@/components/admin/sections/SectionList'
import type { ProductSection } from '@/lib/types'

export default async function SectionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerSupabaseClient()

  const { data: qrCode } = await supabase
    .from('qr_codes')
    .select('id')
    .eq('id', id)
    .single()

  if (!qrCode) redirect('/admin/dashboard')

  const { data: product } = await supabase
    .from('products')
    .select('id, name')
    .eq('qr_code_id', id)
    .single()

  if (!product) redirect('/admin/dashboard')

  const { data: sectionsData } = await supabase
    .from('product_sections')
    .select('*')
    .eq('product_id', product.id)
    .order('display_order', { ascending: true })

  const sections = (sectionsData ?? []) as ProductSection[]

  return (
    <div className="min-h-screen bg-cream-bg">
      <nav className="bg-cream border-b border-gold/30 px-7 py-4 flex items-center gap-4">
        <Link
          href="/admin/dashboard"
          className="text-sm text-brown-light border border-gold/40 rounded-md px-3 py-1.5 hover:bg-gold/10 transition-colors"
        >
          ← 대시보드
        </Link>
        <div>
          <h1 className="text-base font-bold text-brown-dark">{product.name}</h1>
          <span className="text-[9px] tracking-[3px] text-gold">SECTIONS</span>
        </div>
      </nav>
      <main className="max-w-[580px] mx-auto px-6 py-7">
        <SectionList initialSections={sections} productId={product.id} />
      </main>
    </div>
  )
}
