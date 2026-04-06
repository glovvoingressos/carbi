import Link from 'next/link'
import { cars, brands, formatBRL } from '@/data/cars'
import CarCard from '@/components/car/CarCard'
import { ArrowRight, Search, Shield, Fuel, Users, Zap, Wallet, CarFront } from 'lucide-react'

export default function HomePage() {
  const popularCars = cars.filter((c) => c.isPopular)

  const profiles = [
    { id: 'economico', label: 'Mais econômico', icon: Fuel },
    { id: 'familia', label: 'Melhor para família', icon: Users },
    { id: 'seguranca', label: 'Mais seguro', icon: Shield },
    { id: 'tecnologia', label: 'Mais completo', icon: Zap },
    { id: 'desempenho', label: 'Mais potente', icon: CarFront },
    { id: 'custo-beneficio', label: 'Menor preço', icon: Wallet },
  ]

  return (
    <div>
      {/* HERO */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary mb-2">
              Guia automotivo do Brasil
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text tracking-tight leading-tight">
              Descubra o carro certo para &nbsp;voc&ecirc;
            </h1>
            <p className="text-text-secondary text-base sm:text-lg mt-3 leading-relaxed">
              Compare especificações, descubra o melhor para seu perfil e tome a decis&atilde;o com dados reais.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link
                href="/qual-carro"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                <Search className="w-4 h-4" />
                N&atilde;o sei qual escolher
              </Link>
              <Link
                href="/comparar"
                className="inline-flex items-center justify-center gap-2 border border-border hover:border-text-tertiary text-text font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                Comparar carros
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text">Mais buscados</h2>
            <p className="text-sm text-text-secondary mt-0.5">Os carros mais procurados esta semana</p>
          </div>
          <Link href="/rankings" className="text-sm text-primary font-medium hover:underline flex items-center gap-1 flex-shrink-0">
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularCars.slice(0, 8).map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </section>

      {/* MELHORES POR PERFIL */}
      <section className="bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-text">Melhores por perfil</h2>
            <p className="text-sm text-text-secondary mt-0.5">Encontre o ideal para seu dia a dia</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/rankings?profile=${profile.id}`}
                className="flex flex-col items-center text-center p-4 rounded-xl border border-border hover:border-primary/30 bg-surface hover:bg-primary-light transition-all group"
              >
                <profile.icon className="w-6 h-6 mb-2 text-primary group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold text-text leading-tight">{profile.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MARCAS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text">Marcas</h2>
            <p className="text-sm text-text-secondary mt-0.5">Explore por fabricante</p>
          </div>
          <Link href="/marcas" className="text-sm text-primary font-medium hover:underline flex items-center gap-1 flex-shrink-0">
            Ver todas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {brands.slice(0, 12).map((brand) => {
            const count = cars.filter((c) => c.brand === brand).length
            return (
              <Link
                key={brand}
                href={`/marcas/${brand.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-white border border-border rounded-xl p-3.5 text-center hover:border-primary/30 hover:bg-primary-light transition-all"
              >
                <p className="font-semibold text-sm text-text">{brand}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{count} modelo{count > 1 ? 's' : ''}</p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* CTA COMPARAR */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4 pb-12">
        <div className="bg-white border border-border rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-text mb-2">
            Em d&uacute;vida entre dois carros?
          </h2>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Compare lado a lado com destaque de quem vence em cada crit&eacute;rio.
          </p>
          <Link
            href="/comparar"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Comparar agora
          </Link>
        </div>
      </section>
    </div>
  )
}
