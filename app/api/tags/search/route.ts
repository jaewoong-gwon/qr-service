import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const excludeProductId = searchParams.get('excludeProductId')

  if (!q) return NextResponse.json([])

  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('product_tags')
    .select('label')
    .ilike('label', `%${q}%`)
    .limit(50)

  if (excludeProductId) {
    query = query.neq('product_id', excludeProductId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json([], { status: 500 })

  const labels = [...new Set(data.map((r) => r.label))].slice(0, 5)
  return NextResponse.json(labels)
}
