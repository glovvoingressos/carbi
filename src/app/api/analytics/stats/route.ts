import { NextResponse } from 'next/server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
  }

  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase.rpc('get_platform_stats')

  if (error) {
    console.error('get_platform_stats RPC failed:', error)
    return NextResponse.json({ error: 'Falha ao carregar estatísticas.' }, { status: 500 })
  }

  return NextResponse.json(data)
}
