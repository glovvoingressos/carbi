import { NextRequest, NextResponse } from 'next/server'

import { SupportAdminAuthorizationError, requireSupportAdmin } from '../../../../../lib/support-admin'
import { getSupabaseAdminClient } from '../../../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

const CONVERSATION_FIELDS = 'id, visitor_name, visitor_email, status, last_message_at, created_at, updated_at'
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

export async function GET(request: NextRequest) {
  const authorization = await authorize(request)
  if (authorization) return authorization

  const supabase = getSupabaseAdminClient()
  if (!supabase) return unavailable()

  const { page, limit } = readPagination(request)
  const from = (page - 1) * limit
  const to = from + limit - 1
  const { data, error, count } = await supabase
    .from('support_conversations')
    .select(CONVERSATION_FIELDS, { count: 'exact' })
    .order('last_message_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to)

  if (error) return unavailable()

  return NextResponse.json({
    conversations: data ?? [],
    pagination: { page, limit, total: count ?? 0 },
  })
}

async function authorize(request: NextRequest): Promise<NextResponse | undefined> {
  try {
    await requireSupportAdmin(request)
  } catch (error) {
    if (error instanceof SupportAdminAuthorizationError) {
      return NextResponse.json({ error: 'Support admin authorization is required.' }, { status: 401 })
    }
    console.error('[support-admin] authorization failed', error)
    return unavailable()
  }
}

function readPagination(request: NextRequest): { page: number; limit: number } {
  const url = new URL(request.url)
  const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '', 10)
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') ?? '', 10)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE
  return { page, limit }
}

function unavailable() {
  return NextResponse.json({ error: 'Support service is temporarily unavailable.' }, { status: 503 })
}
