import Link from 'next/link'
import type { ListingPublic } from '@/lib/marketplace'
import ListingCard from '@/components/marketplace/ListingCard'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'
import { profiles, priceRanges } from '@/data/cars'
import { Filter, Sparkles } from 'lucide-react'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function readValue(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key]
  if (Array.isArray(value)) return value[0]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readNumber(searchParams: Record<string, string | string[] | undefined>, key: string): number | undefined {
  const value = readValue(searchParams, key)
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function scoreListingForProfile(listing: ListingPublic, profileId: string): number {
  const mileageScore = Math.max(0, 30 - Math.min(30, Math.round(listing.mileage / 4000)))
  const yearScore = Math.max(0, Math.min(20, listing.year_model - 2010))
  const fipeScore = listing.fipe_difference_percent != null
    ? Math.max(0, 30 - Math.max(-20, Math.min(40, Math.round(listing.fipe_difference_percent))))
    : 12
  const offerScore = listing.accepts_offers ? 6 : 0
  const negotiableScore = listing.negotiable && listing.negotiable !== 'firm' ? 4 : 0
  const newerScore = Math.max(0, Math.min(20, listing.year_model - (new Date().getFullYear() - 5)))

  const engine = `${listing.engine || ''} ${listing.fuel}`.toLowerCase()
  const body = `${listing.body_type} ${listing.vehicle_type}`.toLowerCase()
  const options = (listing.optional_items || []).join(' ').toLowerCase()

  switch (profileId) {
    case 'economico':
      return mileageScore + fipeScore + (listing.price < 50000 ? 6 : 0) + (/flex|gasoline/.test(engine) ? 4 : 0)
    case 'custo-beneficio':
      return fipeScore + mileageScore + yearScore + offerScore + negotiableScore
    case 'familia':
      return (
        yearScore +
        (/(suv|sedan|pickup|van)/.test(body) ? 12 : 0) +
        (listing.doors && listing.doors >= 4 ? 8 : 0) +
        (listing.mileage < 80000 ? 8 : 0) +
        fipeScore
      )
    case 'seguranca':
      return newerScore + yearScore + (listing.doors && listing.doors >= 4 ? 6 : 0) + (listing.horsepower && listing.horsepower > 120 ? 3 : 0)
    case 'desempenho':
      return (
        (listing.horsepower || 0) / 8 +
        (/turbo|sport|tsi|tfs/i.test(engine) ? 12 : 0) +
        (listing.transmission?.toString().toLowerCase().includes('autom') ? 4 : 0) +
        Math.max(0, 20 - Math.floor(listing.mileage / 12000))
      )
    case 'tecnologia':
      return (
        (/android auto|carplay|multimedia|multimidia|wifi|bluetooth/.test(options) ? 15 : 0) +
        newerScore +
        (listing.horsepower && listing.horsepower > 110 ? 4 : 0) +
        (listing.transmission?.toString().toLowerCase().includes('autom') ? 4 : 0)
      )
    default:
      return newerScore + mileageScore + fipeScore
  }
}

export default async function RankingsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const profileId = readValue(sp, 'profile') || ''
  const priceRangeId = readValue(sp, 'priceRange') || ''
  const query = (readValue(sp, 'q') || '').toLowerCase()

  const range = priceRanges.find((item) => item.id === priceRangeId) || null
  const listingsPage = await fetchPublicListingsPage({
    q: query || undefined,
    priceMin: range?.min,
    priceMax: range?.max,
    sort: profileId ? 'recent' : range ? 'price_asc' : 'recent',
    page: 1,
    pageSize: 48,
  })

  let ranked = [...listingsPage.items]
  if (profileId) {
    ranked = ranked
      .map((listing) => ({
        listing,
        score: scoreListingForProfile(listing, profileId),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.listing)
  }

  const activeProfile = profiles.find((profile) => profile.id === profileId)

  return (
    <main className="min-h-screen bg-[#f5f5f3] pt-28 pb-20">
      <div className="container mx-auto max-w-6xl px-4">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EAEAE8] bg-white/70 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-[#17170F]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#A3A3A3]">Ranking real de anúncios</span>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#0A0A0A] sm:text-5xl">
            Rankings
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] font-medium leading-relaxed text-[#52607A] sm:text-[16px]">
            {activeProfile
              ? `Ranking por ${activeProfile.label.toLowerCase()} com base nos anúncios ativos da plataforma.`
              : query
                ? `Resultados reais para "${query}".`
                : 'Selecione um perfil ou faixa de preço para ordenar os anúncios reais da plataforma.'}
          </p>
        </header>

        <section className="mb-8 space-y-4 rounded-[28px] border border-[#EAEAE8] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#A3A3A3]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#A3A3A3]">Perfil</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/rankings?profile=${profile.id}`}
                className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                  profileId === profile.id
                    ? 'bg-[#17170F] text-[#FFFDF3]'
                    : 'border border-[#17170F]/10 bg-white text-[#4F4A3E] hover:bg-[#FFF8DF]'
                }`}
              >
                {profile.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#A3A3A3]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#A3A3A3]">Preço</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {priceRanges.map((rangeItem) => (
              <Link
                key={rangeItem.id}
                href={`/rankings?priceRange=${rangeItem.id}`}
                className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                  priceRangeId === rangeItem.id
                    ? 'bg-[#17170F] text-[#FFFDF3]'
                    : 'border border-[#17170F]/10 bg-white text-[#4F4A3E] hover:bg-[#FFF8DF]'
                }`}
              >
                {rangeItem.label}
              </Link>
            ))}
          </div>

          {query && (
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF8DF] px-3 py-2 text-xs font-bold text-[#17170F]">
              Busca ativa: {query}
              <Link href="/rankings" className="text-[#857C6B] underline underline-offset-2">
                limpar
              </Link>
            </div>
          )}
        </section>

        {ranked.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ranked.map((listing, index) => (
              <div key={listing.id} className="relative">
                <ListingCard listing={listing} priority={index < 2} />
                {profileId && index === 0 && (
                  <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-[#D9F85F] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#17170F] shadow-sm">
                    Destaque do ranking
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-[#EAEAE8] bg-white p-10 text-center text-[#52607A]">
            Nenhum anúncio encontrado para os filtros atuais.
          </div>
        )}

        <section className="mt-12 rounded-[28px] border border-[#EAEAE8] bg-white p-6">
          <h2 className="text-xl font-black text-[#0A0A0A]">Por que este ranking é real</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#52607A]">
            Os cards acima vêm do marketplace ativo. Quando o perfil é selecionado, a ordenação usa sinais do anúncio
            como quilometragem, ano/modelo, diferença para a FIPE, opcionais e tipo de carroceria.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#52607A]">
            Isso mantém a navegação útil para descoberta, sem depender de catálogo estático.
          </p>
        </section>
      </div>
    </main>
  )
}
