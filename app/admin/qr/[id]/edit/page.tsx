import { createServerSupabaseClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { EditClient } from './EditClient'
import type { QrCodeWithProduct, NoticeGroup } from '@/lib/types'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerSupabaseClient()

  const [{ data, error }, { data: allGroups }] = await Promise.all([
    supabase
      .from('qr_codes')
      .select(`
        *,
        products (
          *,
          product_tags ( id, label, sort_order ),
          notice_groups ( id, name, notice_group_items ( id, content, sort_order ) ),
          product_sections ( * )
        )
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('notice_groups')
      .select('id, name, notice_group_items ( id, content, sort_order )')
      .order('name'),
  ])

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  if (!data) notFound()

  // PostgREST returns one-to-many as array; take first element
  const raw = data as any
  const item: QrCodeWithProduct = {
    ...raw,
    products: Array.isArray(raw.products) ? (raw.products[0] ?? null) : raw.products,
  }
  const groups = (allGroups ?? []) as unknown as (NoticeGroup & { id: string; name: string })[]

  return <EditClient item={item} allNoticeGroups={groups} />
}
