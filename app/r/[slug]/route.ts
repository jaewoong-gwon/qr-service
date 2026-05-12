import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createServerSupabaseClient()

  const { data } = await supabase
    .from('qr_codes')
    .select('drive_url')
    .eq('slug', slug)
    .single()

  if (!data) {
    return new NextResponse('유효하지 않은 QR 코드입니다', { status: 404 })
  }

  return NextResponse.redirect(data.drive_url, { status: 302 })
}
