import { NextRequest, NextResponse } from 'next/server'

import { SupportAdminAuthorizationError, requireSupportAdmin } from '@/lib/support-admin'
import { getSupabaseAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
const USER_FIELDS = 'id, email, full_name, created_at, email_confirmed_at'

export async function GET(request: NextRequest) {
  try {
    await requireSupportAdmin(request)
  } catch (error) {
    if (error instanceof SupportAdminAuthorizationError) {
      return NextResponse.json({ error: 'Acesso administrativo necessário.' }, { status: 401 })
    }
    console.error('[admin-users] authorization failed', error)
    return NextResponse.json({ error: 'Não foi possível validar o acesso administrativo.' }, { status: 503 })
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Serviço temporariamente indisponível.' }, { status: 503 })
  }

  const url = new URL(request.url)
  const page = readPositiveInteger(url.searchParams.get('page'), 1, 1_000_000)
  const limit = readPositiveInteger(url.searchParams.get('limit'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  const from = (page - 1) * limit
  const to = from + limit - 1
  const search = (url.searchParams.get('q') ?? '')
    .trim()
    .replace(/[,()%_*\\'"\r\n]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80)

  let query = supabase
    .from('users')
    .select(USER_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) {
    console.error('[admin-users] failed to load users', error)
    return NextResponse.json({ error: 'Não foi possível carregar os usuários cadastrados.' }, { status: 503 })
  }

  return NextResponse.json({
    users: data ?? [],
    pagination: { page, limit, total: count ?? 0 },
  })
}

function readPositiveInteger(value: string | null, fallback: number, maximum: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback
}
