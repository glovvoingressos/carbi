import Link from 'next/link'
import { formatBRL, profiles, priceRanges, matchCarToProfile, getCarScoreByProfile } from '@/data/cars'
import CarCard from '@/components/car/CarCard'
import { Trophy, Filter } from 'lucide-react'
import { getAllCars } from '@/lib/data-fetcher'

export default async function RankingsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string }> }) {
  const cars = await getAllCars()
  const sp = await searchParams
  const sortByProfile = sp.profile || null
  const sortByPrice = sp.priceRange || null
  const query = (sp.q || '').trim().toLowerCase()

  let ranked = [...cars]

  if (query) {
    ranked = ranked.filter((car) => {
      const haystack = `${car.brand} ${car.model} ${car.version}`.toLowerCase()
      return haystack.includes(query)
    })
  }

  if (sortByProfile) {
    const scored = ranked
      .map((c) => ({ car: c, score: getCarScoreByProfile(c, sortByProfile) }))
      .sort((a, b) => (b.score as number) - (a.score as number))
    ranked = scored.map((s) => s.car)
  } else if (sortByPrice) {
    const range = priceRanges.find(r => r.id === sortByPrice)
    if (range) {
      ranked = ranked.filter((c) => c.priceBrl >= range.min && c.priceBrl <= range.max).sort((a, b) => a.priceBrl - b.priceBrl)
    }
  }

  const activeProfile = profiles.find((p) => p.id === sortByProfile)
  const rankedCars = ranked
  const rankedScores = sortByProfile
    ? rankedCars.map((c) => getCarScoreByProfile(c, sortByProfile))
    : rankedCars.map(() => null as number | null)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-heading text-text tracking-wide">Rankings</h1>
      <p className="text-sm text-text-secondary mt-1">
        {activeProfile
          ? `Ranking por ${activeProfile.label.toLowerCase()}`
          : query
          ? `Resultados reais para "${sp.q}".`
          : 'Os melhores por perfil e pre&ccedil;o.'}
      </p>

      {/* Quick filters */}
      <div className="mt-4 mb-6 space-y-3">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Perfil</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {profiles.map((p) => (
            <Link key={p.id} href={`/rankings?profile=${p.id}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortByProfile === p.id
                  ? 'bg-primary text-white'
                  : 'bg-[#f3f6fb] text-text-secondary hover:bg-[#edf2f8] hover:text-primary'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <Filter className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Pre&ccedil;o</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sortByProfile === null && priceRanges.map((r) => (
            <Link key={r.id} href={`/rankings?priceRange=${r.id}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortByPrice === r.id
                  ? 'bg-primary text-white'
                  : 'bg-[#f3f6fb] text-text-secondary hover:bg-[#edf2f8] hover:text-primary'
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Results as cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {rankedCars.map((car, index) => {
          const score = rankedScores[index]
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`

          return (
            <div key={car.id} className={`${index === 0 && sortByProfile ? 'ring-2 ring-primary' : ''} rounded-xl`}>
              <div className={`${index === 0 && sortByProfile ? 'bg-[#f7f9fc] ring-1 ring-inset ring-transparent rounded-xl' : ''}`}>
                <CarCard car={car} />
                {index === 0 && sortByProfile && (
                  <div className="bg-primary-light rounded-b-xl border border-t-0 border-primary/20 px-4 py-3 -mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text">Destaque do ranking</span>
                      <span className="text-xs text-primary font-medium">Score: {Math.round(score ?? 0)}</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-1.5 mt-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.round(score ?? 0)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {rankedCars.length === 0 && (
        <div className="mt-8 rounded-xl bg-[#f7f9fc] p-6 text-sm font-semibold text-text-secondary">
          Nenhum resultado encontrado para a busca atual.
        </div>
      )}
    </div>
  )
}
