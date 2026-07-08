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
    <main className="fingen-shell">
      <div className="fingen-shell-content">
        <div className="fingen-shell-hero">
          <div className="fingen-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Rankings</span>
          </div>
          <h1 className="text-balance">Rankings</h1>
          <p>
            {activeProfile
              ? `Ranking por ${activeProfile.label.toLowerCase()} com base nos anúncios ativos da plataforma.`
              : query
                ? `Resultados reais para "${query}".`
                : 'Selecione um perfil ou faixa de preço para ordenar os anúncios reais da plataforma.'}
          </p>
        </div>

        <section className="fingen-card-white" style={{ marginBottom: '32px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Filter style={{ width: '16px', height: '16px', color: 'var(--color-text-tertiary)' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-tertiary)' }}>Perfil</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/rankings?profile=${profile.id}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: profileId === profile.id ? 'none' : '1px solid var(--color-border)',
                  background: profileId === profile.id ? 'var(--color-text-primary)' : 'var(--color-bg-elevated)',
                  color: profileId === profile.id ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {profile.label}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Filter style={{ width: '16px', height: '16px', color: 'var(--color-text-tertiary)' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-tertiary)' }}>Preço</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {priceRanges.map((rangeItem) => (
              <Link
                key={rangeItem.id}
                href={`/rankings?priceRange=${rangeItem.id}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: priceRangeId === rangeItem.id ? 'none' : '1px solid var(--color-border)',
                  background: priceRangeId === rangeItem.id ? 'var(--color-text-primary)' : 'var(--color-bg-elevated)',
                  color: priceRangeId === rangeItem.id ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {rangeItem.label}
              </Link>
            ))}
          </div>

          {query && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '8px 16px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent-soft)', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Busca ativa: {query}
              <Link href="/rankings" style={{ color: 'var(--color-text-tertiary)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                limpar
              </Link>
            </div>
          )}
        </section>

        {ranked.length > 0 ? (
          <div className="fingen-grid-3">
            {ranked.map((listing, index) => (
              <div key={listing.id} style={{ position: 'relative' }}>
                <ListingCard listing={listing} priority={index < 2} />
                {profileId && index === 0 && (
                  <div style={{ position: 'absolute', top: '16px', left: '16px', padding: '4px 12px', background: 'var(--color-accent)', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-primary)' }}>
                    Destaque do ranking
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="fingen-card-white" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-secondary)' }}>
            Nenhum anúncio encontrado para os filtros atuais.
          </div>
        )}

        <section className="fingen-card-white" style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px' }}>Por que este ranking é real</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '8px' }}>
            Os cards acima vêm do marketplace ativo. Quando o perfil é selecionado, a ordenação usa sinais do anúncio
            como quilometragem, ano/modelo, diferença para a FIPE, opcionais e tipo de carroceria.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            Isso mantém a navegação útil para descoberta, sem depender de catálogo estático.
          </p>
        </section>
      </div>
    </main>
  )
}
