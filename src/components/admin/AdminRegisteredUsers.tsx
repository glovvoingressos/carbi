'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Clock3, Loader2, Search, Users, UserRound } from 'lucide-react'

import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

type RegisteredUser = {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
  email_confirmed_at: string | null
}

type UserListResponse = {
  users?: RegisteredUser[]
  pagination?: { page?: number; limit?: number; total?: number }
  error?: string
}

const PAGE_SIZE = 25
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })

export default function AdminRegisteredUsers() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [users, setUsers] = useState<RegisteredUser[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      router.replace('/entrar?redirect=/admin/usuarios')
      return
    }

    let active = true
    const loadSession = async () => {
      try {
        const { data: { session } } = await getSupabaseBrowserClient().auth.getSession()
        if (!active) return
        if (!session?.access_token) {
          router.replace('/entrar?redirect=/admin/usuarios')
          return
        }
        setToken(session.access_token)
      } catch {
        if (active) router.replace('/entrar?redirect=/admin/usuarios')
      } finally {
        if (active) setReady(true)
      }
    }

    void loadSession()
    return () => { active = false }
  }, [router])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (!token || unauthorized) return
    let active = true
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (search) params.set('q', search)

    void fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json() as UserListResponse
        if (response.status === 401) {
          if (active) setUnauthorized(true)
          return
        }
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar os usuários.')
        if (active) {
          setUsers(data.users ?? [])
          setTotal(data.pagination?.total ?? 0)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os usuários.')
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [page, reloadKey, search, token, unauthorized])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, total)

  if (!ready) return <PageLoading />
  if (unauthorized) return <UnauthorizedState />

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 text-[#1A1A1A] sm:p-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Usuários cadastrados</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6F6F6F]">Consulte as novas contas e acompanhe quais emails ainda aguardam confirmação.</p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Seções administrativas">
          <Link href="/admin/analytics" className="rounded-xl border border-[#E6E7E3] bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-[#F5F5F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5A47D1]">Analytics</Link>
          <Link href="/admin/suporte" className="rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-sm font-semibold text-[#D4F576] transition hover:bg-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5A47D1]">Inbox de suporte</Link>
        </nav>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[#E6E7E3] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#EAEAE8] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4F576] text-[#1A1A1A]"><Users size={19} aria-hidden="true" /></span>
            <div>
              <h2 className="font-bold">Contas</h2>
              <p className="mt-0.5 text-xs text-[#6F6F6F]">{total.toLocaleString('pt-BR')} cadastradas</p>
            </div>
          </div>
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Buscar por nome ou email</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A95A8]" size={17} aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setLoading(true)
                setError(null)
                setSearchInput(event.target.value)
              }}
              placeholder="Buscar por nome ou email"
              className="w-full rounded-xl border border-[#E1E4DE] bg-[#FAFAF8] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#1A1A1A] focus-visible:ring-2 focus-visible:ring-[#D4F576]"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="m-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B91C1C] sm:m-5">
            <span className="flex items-center gap-2"><CircleAlert size={17} aria-hidden="true" />{error}</span>
            <button type="button" onClick={() => { setLoading(true); setError(null); setReloadKey((value) => value + 1) }} className="min-h-10 rounded-lg px-3 font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5A47D1]">Tentar novamente</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="bg-[#F7F8F4] text-xs font-bold uppercase tracking-wide text-[#6F6F6F]">
              <tr>
                <th scope="col" className="px-5 py-3.5">Pessoa</th>
                <th scope="col" className="px-5 py-3.5">Email</th>
                <th scope="col" className="px-5 py-3.5">Cadastro</th>
                <th scope="col" className="px-5 py-3.5">Confirmação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F1EC]">
              {loading && users.length === 0 ? <LoadingRows /> : null}
              {!loading && !error && users.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-14 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F3ED] text-[#697386]"><Users size={21} aria-hidden="true" /></span>
                    <h3 className="mt-3 font-bold">{search ? 'Nenhum resultado encontrado' : 'Ainda não há usuários cadastrados'}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#6F6F6F]">{search ? 'Confira a grafia do nome ou do email e tente novamente.' : 'As contas criadas aparecerão aqui, mesmo antes da confirmação do email.'}</p>
                  </div>
                </td></tr>
              ) : null}
              {users.map((user) => {
                const confirmed = Boolean(user.email_confirmed_at)
                return (
                  <tr key={user.id} className="transition hover:bg-[#FAFAF8]">
                    <td className="px-5 py-4">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1F3ED] text-[#697386]"><UserRound size={16} aria-hidden="true" /></span>
                        <span className="truncate font-semibold">{user.full_name?.trim() || 'Sem nome informado'}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#3A3A3A]">{user.email || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#6F6F6F]">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${confirmed ? 'bg-[#E8F7EF] text-[#176B43]' : 'bg-[#FFF5D9] text-[#805A00]'}`}>
                        {confirmed ? <CheckCircle2 size={13} aria-hidden="true" /> : <Clock3 size={13} aria-hidden="true" />}
                        {confirmed ? 'Confirmado' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-[#EAEAE8] px-4 py-4 text-xs text-[#6F6F6F] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p>{loading ? 'Atualizando lista…' : `Exibindo ${start}–${end} de ${total.toLocaleString('pt-BR')}`}</p>
          <nav className="flex items-center gap-2" aria-label="Paginação de usuários">
            <button type="button" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setError(null); setPage((value) => Math.max(1, value - 1)) }} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#E1E4DE] px-3 font-semibold text-[#1A1A1A] transition hover:bg-[#F5F5F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5A47D1] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={15} aria-hidden="true" />Anterior</button>
            <span className="px-1 font-semibold text-[#3A3A3A]">{page} / {pageCount}</span>
            <button type="button" disabled={page >= pageCount || loading} onClick={() => { setLoading(true); setError(null); setPage((value) => Math.min(pageCount, value + 1)) }} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#E1E4DE] px-3 font-semibold text-[#1A1A1A] transition hover:bg-[#F5F5F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5A47D1] disabled:cursor-not-allowed disabled:opacity-40">Próxima<ChevronRight size={15} aria-hidden="true" /></button>
          </nav>
        </footer>
      </section>
    </main>
  )
}

function LoadingRows() {
  return <>
    {[0, 1, 2, 3, 4].map((row) => (
      <tr key={row} aria-hidden="true" className="animate-pulse border-b border-[#F0F1EC]">
        <td className="px-5 py-4"><span className="block h-9 w-36 rounded-lg bg-[#F1F3ED]" /></td>
        <td className="px-5 py-4"><span className="block h-4 w-40 rounded bg-[#F1F3ED]" /></td>
        <td className="px-5 py-4"><span className="block h-4 w-28 rounded bg-[#F1F3ED]" /></td>
        <td className="px-5 py-4"><span className="block h-7 w-24 rounded-full bg-[#F1F3ED]" /></td>
      </tr>
    ))}
  </>
}

function PageLoading() {
  return <main className="mx-auto max-w-7xl p-4 sm:p-8"><div role="status" className="flex min-h-56 items-center justify-center gap-3 text-sm text-[#6F6F6F]"><Loader2 size={18} className="animate-spin" aria-hidden="true" />Carregando usuários…</div></main>
}

function UnauthorizedState() {
  return <main className="mx-auto max-w-7xl p-4 sm:p-8"><section role="alert" className="rounded-2xl border border-[#E6E7E3] bg-white p-8 text-center"><CircleAlert size={24} className="mx-auto text-[#B91C1C]" aria-hidden="true" /><h1 className="mt-3 text-xl font-bold">Acesso administrativo necessário</h1><p className="mt-2 text-sm text-[#6F6F6F]">Entre com uma conta autorizada para consultar os cadastros.</p></section></main>
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date)
}
