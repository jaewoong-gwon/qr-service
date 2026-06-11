import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ProductLandingPage } from '@/components/ProductLandingPage'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServerSupabaseClient()

  const { data: qrCode } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!qrCode) notFound()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('qr_code_id', qrCode.id)
    .single()

  return <ProductLandingPage product={product ?? null} />
}
