import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import type { QrCodeWithProduct } from '@/lib/types'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServerSupabaseClient()

  const { data: qrCode, error } = await supabase
    .from('qr_codes')
    .select(`
      *,
      products (
        *,
        product_tags ( label, sort_order ),
        notice_groups ( notice_group_items ( content, sort_order ) ),
        product_sections (
          *,
          product_section_items ( title, description, sort_order )
        )
      )
    `)
    .eq('slug', slug)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  if (!qrCode) notFound()

  const item = qrCode as unknown as QrCodeWithProduct

  return <ProductLandingPage product={item.products} />
}
