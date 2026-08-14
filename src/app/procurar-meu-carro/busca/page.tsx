import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBuyerSearchByToken, listMatchesForSearch, resetMatchRead } from '@/lib/buyer-agent/search'
import { criteriaLines, matchLevelLabels } from '@/lib/buyer-agent/explain'
import type { MatchLevel } from '@/lib/buyer-agent/types'
import { formatBRL } from '@/data/cars'
import MarketplaceListingImage from '@/components/marketplace/MarketplaceListingImage'
import Link from 'next/link'
import { ArrowRight, BellRing, Calendar, Gauge, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Minha busca | Carbi',
  description: 'Acompanhe sua busca no Carbi e as oportunidades compatíveis que encontramos para você.',
}

const levelClass: Record<MatchLevel, string> = {
  exato: 'buyer-badge buyer-badge-exato',
  proximo: 'buyer-badge buyer-badge-proximo',
  possivel: 'buyer-badge buyer-badge-possivel',
}

export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams
  if (!t) notFound()

  const search = await getBuyerSearchByToken(t)
  if (!search) notFound()

  const matches = await listMatchesForSearch(search.id)
  const lines = criteriaLines(search.criteria)
  const unread = matches.filter((m) => !m.in_app_read)

  await Promise.all(unread.map((m) => resetMatchRead(search.id, m.id)))

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-3 py-1.5 text-xs font-bold tracking-widest text-[#D4F576]">
          <BellRing size={13} /> PROCURE MEU CARRO
        </div>
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">Sua busca no Carbi</h1>
        <p className="mt-1 text-sm text-[#3A3A3A]">
          {matches.length === 0
            ? 'Ainda não encontramos uma opção compatível. Continue acompanhando — avisamos você quando aparecer.'
            : 'Encontramos as oportunidades compatíveis abaixo. Avisamos você por e-mail e aqui dentro.'}
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-[#1A1A1A]/10 bg-white p-5">
        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-[#857C6B]">O que você procura</div>
        {lines.length > 0 ? (
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {lines.map((l) => (
              <div key={l.key}>
                <div className="text-[11px] uppercase tracking-wide text-[#857C6B]">{l.label}</div>
                <div className="text-sm font-semibold text-[#1A1A1A]">{l.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#1A1A1A]">{search.original_query}</p>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="buyer-empty">
          <div className="buyer-empty-icon">
            <BellRing size={34} strokeWidth={1.5} />
          </div>
          <h3>Continuamos de olho para você.</h3>
          <p>Novos carros aparecem todos os dias. Quando surgir uma oportunidade compatível, chamamos você por aqui e por e-mail.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {matches.map((m) => {
            const l = m.listing
            if (!l) return null
            return (
              <article key={m.id} className="buyer-result-card">
                <div className="buyer-result-media">
                  {l.image ? (
                    <MarketplaceListingImage
                      brand={l.brand}
                      model={l.model}
                      year={l.year_model}
                      imageUrls={l.image ? [l.image] : []}
                      alt={`${l.brand} ${l.model} ${l.year_model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#EDEBE6] text-[#857C6B]">
                      <Gauge size={40} strokeWidth={1.25} />
                    </div>
                  )}
                </div>
                <div className="buyer-result-body">
                  <span className={levelClass[m.match_level]}>{matchLevelLabels[m.match_level]}</span>
                  <h3 className="buyer-result-title">
                    {l.brand} {l.model} {l.year_model}
                  </h3>
                  <div className="buyer-result-price">{formatBRL(Number(l.price))}</div>
                  <div className="buyer-result-specs">
                    {l.transmission && (
                      <span className="buyer-result-spec">
                        <Gauge size={14} /> {l.transmission}
                      </span>
                    )}
                    {l.mileage != null && (
                      <span className="buyer-result-spec">
                        <Calendar size={14} /> {l.mileage.toLocaleString('pt-BR')} km
                      </span>
                    )}
                    <span className="buyer-result-spec">
                      <MapPin size={14} /> {l.city}
                      {l.state ? `/${l.state}` : ''}
                    </span>
                  </div>
                  {m.explanation && <p className="buyer-result-explain">{m.explanation}</p>}
                  <Link href={`/anuncios/${l.slug}`} className="buyer-ver-carro">
                    Ver carro <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}