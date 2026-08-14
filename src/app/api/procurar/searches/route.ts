import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { createBuyerSearch, listSearchesForUser, getBuyerSearchByToken, listMatchesForSearch } from '@/lib/buyer-agent/search'
import { criteriaSchema } from '@/lib/buyer-agent/types'
import { criteriaSummary } from '@/lib/buyer-agent/explain'
import { sendSearchSavedEmail } from '@/lib/buyer-agent/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

interface SaveSearchBody {
  original_query?: string
  criteria?: unknown
  interpretation_source?: 'rules' | 'llm'
  contact_email?: string
}

export async function POST(req: NextRequest) {
  let body: SaveSearchBody
  try {
    body = (await req.json()) as SaveSearchBody
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const originalQuery = (body?.original_query || '').trim()
  if (!originalQuery) {
    return NextResponse.json({ error: 'Informe o que você procura.' }, { status: 400 })
  }

  const parsed = criteriaSchema.safeParse(body?.criteria)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Critérios inválidos.' }, { status: 400 })
  }

  const auth = await getAuthContext(req)
  const userId = auth?.userId || null

  let authEmail: string | null = null
  if (auth && userId) {
    const supabase = getSupabaseServerClient(auth.accessToken)
    const { data: user } = await supabase.auth.getUser()
    authEmail = user?.user?.email || null
  }

  const email = userId ? authEmail : body?.contact_email
  const contactEmail = email && email.trim() ? email.trim() : null

  if (!userId && !contactEmail) {
    return NextResponse.json({ error: 'Informe um e-mail para receber os avisos (ou entre na sua conta).' }, { status: 400 })
  }

  const search = await createBuyerSearch({
    user_id: userId,
    contact_email: contactEmail || 'sem-email@carbi.com.br',
    original_query: originalQuery,
    criteria: parsed.data,
    interpretation_source: body?.interpretation_source || 'rules',
  })

  if (!search) {
    return NextResponse.json({ error: 'Não foi possível salvar sua busca. Tente novamente.' }, { status: 500 })
  }

  const searchUrl = userId
    ? `${SITE_URL}/minha-conta/buscas`
    : `${SITE_URL}/procurar-meu-carro/busca?t=${search.view_token}`

  if (contactEmail) {
    void sendSearchSavedEmail({
      to: contactEmail,
      summary: criteriaSummary(search.criteria),
      searchUrl,
    })
  }

  return NextResponse.json({
    id: search.id,
    summary: criteriaSummary(search.criteria),
    viewToken: search.view_token,
    userScoped: Boolean(userId),
    searchUrl,
  })
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('t')
  const auth = await getAuthContext(req)

  if (token) {
    const search = await getBuyerSearchByToken(token)
    if (!search) return NextResponse.json({ error: 'Busca não encontrada.' }, { status: 404 })
    const matches = await listMatchesForSearch(search.id)
    return NextResponse.json({ search, matches })
  }

  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const searches = await listSearchesForUser(auth.userId)
  const withMatches = await Promise.all(
    searches.map(async (s) => ({ ...s, matches: await listMatchesForSearch(s.id) })),
  )
  return NextResponse.json({ searches: withMatches })
}