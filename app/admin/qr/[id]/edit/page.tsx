// app/admin/qr/[id]/edit/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase'
import { getFolderImages } from '@/lib/drive'
import { notFound } from 'next/navigation'
import { EditClient } from './EditClient'
import type { QrCodeWithProduct } from '@/lib/types'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
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
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  if (!data) notFound()

  const item = data as unknown as QrCodeWithProduct
  const images = await getFolderImages(item.drive_folder_url)

  return <EditClient item={item} images={images} />
}
