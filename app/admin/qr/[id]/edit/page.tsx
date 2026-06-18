import { createServerSupabaseClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { EditClient } from './EditClient'
import type { QrCodeWithProduct, NoticeGroup, Store, ClosingTemplate, ContentLibraryItem } from '@/lib/types'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerSupabaseClient()

  const [{ data, error }, { data: allGroups }, { data: allStores }, { data: allClosingTemplates }, { data: allContentLibrary }] =
    await Promise.all([
      supabase
        .from('qr_codes')
        .select(`
          *,
          products (
            *,
            product_tags ( id, label, sort_order ),
            notice_groups ( id, name, notice_group_items ( id, content, sort_order ) ),
            closing_templates ( id, name, body ),
            product_sections ( * ),
            product_content_links ( id, sort_order, content_library ( id, title, body ) )
          )
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('notice_groups')
        .select('id, name, notice_group_items ( id, content, sort_order )')
        .order('name'),
      supabase
        .from('stores')
        .select('id, name, slug, created_at, admin_id')
        .order('created_at', { ascending: true }),
      supabase
        .from('closing_templates')
        .select('id, name, body')
        .order('name'),
      supabase
        .from('content_library')
        .select('id, title, body')
        .order('title'),
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
  const stores = (allStores ?? []) as unknown as Store[]
  const closingTemplates = (allClosingTemplates ?? []) as ClosingTemplate[]
  const contentLibrary = (allContentLibrary ?? []) as ContentLibraryItem[]

  return <EditClient item={item} allNoticeGroups={groups} stores={stores} closingTemplates={closingTemplates} contentLibrary={contentLibrary} />
}
