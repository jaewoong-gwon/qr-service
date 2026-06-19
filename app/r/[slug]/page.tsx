import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ProductLandingPage } from '@/components/ProductLandingPage'
import type { Product } from '@/lib/types'

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
        closing_templates ( id, name, body ),
        product_sections ( * ),
        product_content_links ( id, sort_order, content_library ( id, title, body, icon ) )
      )
    `)
    .eq('slug', slug)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  if (!qrCode) notFound()

  // PostgREST returns one-to-many as array; take first element
  const raw = qrCode as any
  const product = (Array.isArray(raw.products) ? raw.products[0] ?? null : raw.products) as Product | null

  return <ProductLandingPage product={product} />
}
