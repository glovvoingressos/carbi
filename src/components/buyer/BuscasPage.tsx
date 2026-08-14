'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BellRing, Loader2, Calendar, Gauge, MapPin, Car } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { formatBRL } from '@/data/cars'
import MarketplaceListingImage from '@/components/marketplace/MarketplaceListingImage'
import { matchLevelLabels } from '@/lib/buyer-agent/explain'
import type { BuyerSearchRow } from '@/lib/buyer-agent/types'

const PROMISE_COPY =
  'O Carbi acompanha os anúncios disponíveis e procura oportunidades compatíveis com o que você procura. Quando aparecer uma oportunidade compatível, avisaremos você.'

const levelClass: Record<string, string> = {
  exato: 'buyer-badge buyer-badge-exato',
  proximo: 'buyer-badge buyer-badge-proximo',
  possivel: 'buyer-badge buyer-badge-possivel',
}

export default function BuscasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searches, setSearches] = useState<BuyerSearchRow[]>([])

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      router.replace('/entrar')
      return
    }
    const load = async () => {
      const sb = getSupabaseBrowserClient()
      const { data: { session } } = await sb.auth.getSession()
      if (!session) {
        router.replace('/entrar?redirect=/minha-conta/buscas')
        return
      }
      try {
        const res = await fetch('/api/procurar/searches', { headers: { Authorization: `Bearer ${session.access_token}` } })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Falha ao carregar buscas.')
        setSearches((data?.searches || []) as BuyerSearchRow[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar buscas.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8">
        <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-3 py-1.5 text-xs font-bold tracking-widest text-[#D4F576]">
          <BellRing size={13} /> PROCURE MEU CARRO
        </span>
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">Minhas buscas</h1>
        <p className="mt-1 text-sm text-[#3A3A3A]">Acompanhe o que você está procurando e as oportunidades que encontramos.</p>
      </div>

      <div className="mb-8">
        <Link href="/procurar-meu-carro" className="buyer-btn buyer-btn-chartreuse">
          Nova busca <ArrowRight size={16} />
        </Link>
      </div>

      {error && <div className="buyer-error">{error}</div>}

      {searches.length === 0 ? (
        <div className="buyer-empty">
          <div className="buyer-empty-icon"><BellRing size={34} strokeWidth={1.5} /></div>
          <h3>Você ainda não tem buscas salvas.</h3>
          <p>Diga qual carro você procura e a gente cuida da caça — avisando quando aparecer uma oportunidade compatível.</p>
          <Link href="/procurar-meu-carro" className="buyer-btn buyer-btn-chartreuse">
            Começar uma busca <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {searches.map((s) => {
            const matches = s.matches || []
            const unread = matches.filter((m) => !m.in_app_read).length
            return (
              <section key={s.id} className="buyer-card">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="buyer-summary-title">{s.original_query}</h2>
                    <p className="buyer-summary-sub">
                      {s.status === 'active' ? 'Ativa' : s.status} · {matches.length} oportunidade{matches.length === 1 ? '' : 's'}
                      {unread > 0 && <span className="ml-2 rounded-full bg-[#D4F576] px-2 py-0.5 text-[11px] font-bold text-[#1A1A1A]">{unread} nova{unread === 1 ? '' : 's'}</span>}
                    </p>
                  </div>
                </div>

                {matches.length === 0 ? (
                  <p className="rounded-xl bg-[#F5F5F5] px-4 py-3 text-sm text-[#3A3A3A]">
                    {PROMISE_COPY}
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {matches.map((m) => {
                      const l = m.listing
                      if (!l) return null
                      return (
                        <article key={m.id} className="rounded-xl border border-[#1A1A1A]/8 bg-white p-4">
                          <div className="mb-3 flex gap-3">
                            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-[#EDEBE6]">
                              {l.image ? (
                                <MarketplaceListingImage
                                  brand={l.brand}
                                  model={l.model}
                                  year={l.year_model}
                                  imageUrls={[l.image]}
                                  alt={`${l.brand} ${l.model} ${l.year_model}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#857C6B]"><Car size={24} strokeWidth={1.25} /></div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className={`mb-1 ${levelClass[m.match_level]}`}>{matchLevelLabels[m.match_level]}</span>
                              <div className="truncate font-bold text-[#1A1A1A]">{l.brand} {l.model} {l.year_model}</div>
                              <div className="font-extrabold text-[#1A1A1A]">{formatBRL(Number(l.price))}</div>
                              <div className="flex flex-wrap gap-x-3 text-xs text-[#3A3A3A]">
                                {l.mileage != null && <span>{l.mileage.toLocaleString('pt-BR')} km</span>}
                                <span>{l.city}{l.state ? `/${l.state}` : ''}</span>
                              </div>
                            </div>
                          </div>
                          <Link href={`/anuncios/${l.slug}`} className="buyer-ver-carro w-full justify-center text-sm">
                            Ver carro <ArrowRight size={14} />
                          </Link>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}