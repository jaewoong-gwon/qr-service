import { createServerSupabaseClient } from '@/lib/supabase'
import { getFolderImages } from '@/lib/drive'
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
          product_sections (
            *,
            product_section_items ( id, title, description, sort_order )
          )
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

  const item = data as unknown as QrCodeWithProduct
  const images = await getFolderImages(item.drive_folder_url)
  const groups = (allGroups ?? []) as (NoticeGroup & { id: string; name: string })[]

  return <EditClient item={item} images={images} allNoticeGroups={groups} />
}
