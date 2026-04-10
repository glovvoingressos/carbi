import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

type TableStatus = {
  table: string
  exists: boolean
  access: 'ok' | 'permission_limited' | 'missing' | 'error'
  message?: string
}

function classifyError(table: string, message?: string): TableStatus {
  if (!message) {
    return { table, exists: false, access: 'error', message: 'Erro desconhecido' }
  }
  const lowered = message.toLowerCase()
  if (lowered.includes('could not find the table') || lowered.includes('does not exist') || lowered.includes('relation')) {
    return { table, exists: false, access: 'missing', message }
  }
  if (lowered.includes('permission') || lowered.includes('rls') || lowered.includes('not allowed')) {
    return { table, exists: true, access: 'permission_limited', message }
  }
  return { table, exists: false, access: 'error', message }
}

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const auth = await getAuthContext(req)
    const supabase = getSupabaseServerClient(auth?.accessToken)

    const tables = [
      'users',
      'vehicles',
      'vehicle_images',
      'vehicle_listings',
      'vehicle_listing_images',
      'conversations',
      'conversation_messages',
      'messages',
    ]

    const checks = await Promise.all(
      tables.map(async (table) => {
        const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' }).limit(1)
        if (!error) {
          return { table, exists: true, access: 'ok' } as TableStatus
        }
        return classifyError(table, error.message)
      }),
    )

    const allRequiredExists = checks
      .filter((item) => ['users', 'vehicles', 'vehicle_images', 'vehicle_listings', 'conversations', 'messages'].includes(item.table))
      .every((item) => item.exists)

    const statusCode = allRequiredExists ? 200 : 503

    return NextResponse.json(
      {
        ok: allRequiredExists,
        checkedAt: new Date().toISOString(),
        authenticated: !!auth,
        checks,
      },
      { status: statusCode },
    )
  } catch (error) {
    console.error('GET /api/marketplace/audit failed', error)
    return NextResponse.json({ error: 'Falha na auditoria do marketplace.' }, { status: 500 })
  }
}
