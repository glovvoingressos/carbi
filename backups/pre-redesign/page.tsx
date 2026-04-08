import Link from 'next/link'
import { formatBRL } from '@/data/cars'
import CarCard from '@/components/car/CarCard'
import SearchBar from '@/components/ui/SearchBar'
import {
  ArrowRight, ArrowUpRight, Fuel, Users, Shield, Zap,
  CarFront, Wallet, Star, ChevronRight, Sparkles,
  TrendingUp, BarChart3, Clock, MapPin
} from 'lucide-react'
import { getAllCars } from '@/lib/data-fetcher'

export default async function HomePage() {
  const cars = await getAllCars()
  const popularCars = cars.filter((c) => c.isPopular || c.priceBrl > 0).slice(0, 6)
  const brands = [...new Set(cars.map(c => c.brand))].sort()
  const featured = cars.find(c => c.isPopular && c.priceBrl > 100000) || cars[0]

  const profiles = [
    { id: 'economico', label: 'Econômico', emoji: '⛽', desc: 'Menor consumo' },
    { id: 'familia', label: 'Família', emoji: '👨‍👩‍👧‍👦', desc: 'Mais espaço' },
    { id: 'seguranca', label: 'Segurança', emoji: '🛡️', desc: 'Mais airbags' },
    { id: 'tecnologia', label: 'Tecnologia', emoji: '⚡', desc: 'Mais completo' },
    { id: 'desempenho', label: 'Potência', emoji: '🏎️', desc: 'Mais cv' },
    { id: 'custo-beneficio', label: 'Custo-benefício', emoji: '💰', desc: 'Melhor preço' },
  ]

  const reviews = [
    { name: 'Rafael M.', rating: 5, text: 'Excelente! Me ajudou a escolher entre o Onix e o HB20 com dados reais de consumo.', car: 'Chevrolet Onix' },
    { name: 'Camila S.', rating: 5, text: 'Finalmente um site que compara carros de forma séria e imparcial. Recomendo demais!', car: 'Hyundai HB20' },
    { name: 'Lucas P.', rating: 4, text: 'A ferramenta de comparação lado a lado é incrível. Decidi em 10 minutos.', car: 'Toyota Corolla' },
    { name: 'Ana B.', rating: 5, text: 'Interface lindíssima e informações precisas. Melhor site de carros do Brasil.', car: 'Jeep Compass' },
  ]

  const avgPrice = Math.round(cars.reduce((a, b) => a + b.priceBrl, 0) / cars.length)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* ━━━ ROW 1: HERO BENTO ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Hero Card — Large */}
        <div className="lg:col-span-8 bento-card-lg scroll-reveal" style={{ minHeight: 380 }}>
          <div className="flex flex-col lg:flex-row items-center h-full gap-4">
            <div className="flex-1 flex flex-col justify-center">
              <span className="badge-green mb-4 inline-flex w-fit">
                <Sparkles className="w-3 h-3 mr-1" />
                Guia Automotivo #1
              </span>
              <h1 className="text-3xl sm:text-[42px] font-extrabold leading-[1.1] tracking-tight" style={{ color: 'var(--color-text)' }}>
                Descubra o carro<br />
                <span style={{ color: 'var(--color-accent)' }}>certo para você</span>
              </h1>
              <p className="text-sm mt-4 max-w-sm leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
                Compare especificações reais, encontre o modelo ideal para seu perfil e tome a melhor decisão.
              </p>
              <div className="mt-6 flex gap-3 flex-wrap">
                <Link href="/qual-carro" className="btn-accent">
                  <Sparkles className="w-4 h-4" />
                  Encontrar meu carro
                </Link>
                <Link href="/comparar" className="btn-ghost">
                  Comparar
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center relative" style={{ minHeight: 220 }}>
              <img
                src="https://images.unsplash.com/photo-1617469767053-d3b523a0b982?q=80&w=1200&auto=format&fit=crop"
                alt={featured?.model || "Volvo EX30"}
                className="w-full max-w-md object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                style={{ animation: 'float 5.1s ease-in-out infinite' }}
              />
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Stat: Veículos */}
          <div className="bento-card scroll-reveal sr-delay-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-3)' }}>
                Veículos
              </span>
              <div className="btn-icon" style={{ width: 28, height: 28, borderRadius: 'var(--radius-xs)' }}>
                <BarChart3 className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold" style={{ color: 'var(--color-text)' }}>
              {cars.length.toLocaleString('pt-BR')}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-accent)' }} />
              <span className="text-[11px] font-semibold" style={{ color: 'var(--color-accent)' }}>+{brands.length} marcas</span>
            </div>
          </div>

          {/* Stat: Preço médio */}
          <div className="bento-card scroll-reveal sr-delay-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-3)' }}>
                Preço Médio
              </span>
              <div className="btn-icon" style={{ width: 28, height: 28, borderRadius: 'var(--radius-xs)' }}>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>
              {formatBRL(avgPrice)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" style={{ color: 'var(--color-text-3)' }} />
              <span className="text-[11px]" style={{ color: 'var(--color-text-3)' }}>Atualizado hoje</span>
            </div>
          </div>

          {/* Search — Mini */}
          <div className="bento-card scroll-reveal sr-delay-3 col-span-2 lg:col-span-1">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* ━━━ ROW 2: DARK DEAL + BRAND SCROLL ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Dark Deal Card */}
        <div className="lg:col-span-5 bento-card-dark scroll-reveal" style={{ minHeight: 200 }}>
          <div className="flex flex-col h-full justify-between">
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-4"
                style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-pill)', color: 'rgba(255,255,255,0.8)' }}
              >
                🔥 Destaque da semana
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                {featured?.brand} {featured?.model}
              </h2>
              <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {featured?.version}
              </p>
            </div>
            <div className="flex items-end justify-between mt-4">
              <div>
                <span className="text-2xl font-extrabold text-white">
                  {formatBRL(featured?.priceBrl || 0)}
                </span>
              </div>
              <Link
                href={`/${featured?.brand.toLowerCase().replace(/\s+/g, '-')}/${featured?.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold"
                style={{ background: 'white', color: 'var(--color-dark)', borderRadius: 'var(--radius-pill)' }}
              >
                Ver
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Brands Horizontal */}
        <div className="lg:col-span-7 bento-card scroll-reveal sr-delay-1" style={{ padding: '20px 0' }}>
          <div className="flex items-center justify-between px-5 mb-4">
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: 'var(--color-text)' }}>Marcas</h3>
              <p className="text-[11px]" style={{ color: 'var(--color-text-3)' }}>Explore por fabricante</p>
            </div>
            <Link href="/marcas" className="btn-icon" style={{ width: 32, height: 32 }}>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="horizontal-scroll px-5">
            {brands.map((brand, i) => {
              const count = cars.filter((c) => c.brand === brand).length
              const logoMap: Record<string, string> = {
                'Toyota': 'https://www.carlogos.org/car-logos/toyota-logo.png',
                'Honda': 'https://www.carlogos.org/car-logos/honda-logo.png',
                'Fiat': 'https://www.carlogos.org/car-logos/fiat-logo.png',
                'Volkswagen': 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
                'Chevrolet': 'https://www.carlogos.org/car-logos/chevrolet-logo.png',
                'Ford': 'https://www.carlogos.org/car-logos/ford-logo.png',
                'Hyundai': 'https://www.carlogos.org/car-logos/hyundai-logo.png',
                'Jeep': 'https://www.carlogos.org/car-logos/jeep-logo.png',
                'Nissan': 'https://www.carlogos.org/car-logos/nissan-logo.png',
                'Peugeot': 'https://www.carlogos.org/car-logos/peugeot-logo.png',
                'Renault': 'https://www.carlogos.org/car-logos/renault-logo.png',
                'BYD': 'https://www.carlogos.org/car-logos/byd-logo.png',
                'Caoa Chery': 'https://www.carlogos.org/car-logos/chery-logo.png',
              }
              const logo = logoMap[brand]

              return (
                <Link key={brand} href={`/marcas/${brand.toLowerCase()}`} className="flex flex-col items-center gap-2 group min-w-[70px]">
                  <div className="w-14 h-14 rounded-full bg-[#F5F5F7] border border-border flex items-center justify-center group-hover:border-accent group-hover:bg-white transition-all duration-300">
                    {logo ? (
                      <img src={logo} alt={brand} className="w-7 h-7 object-contain opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all" />
                    ) : (
                      <span className="text-lg font-bold text-text-3 group-hover:text-accent">{brand[0]}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-text group-hover:text-accent transition-colors">{brand}</p>
                    <p className="text-[10px] text-text-3 font-medium">{count}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ━━━ ROW 3: POPULARES ━━━ */}
      <div>
        <div className="flex items-end justify-between mb-4 scroll-reveal">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Mais buscados</h2>
            <p className="text-[12px]" style={{ color: 'var(--color-text-3)' }}>Veículos com fichas atualizadas</p>
          </div>
          <Link href="/rankings" className="text-[12px] font-semibold flex items-center gap-1" style={{ color: 'var(--color-text-2)' }}>
            Ver todos <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularCars.map((car, i) => (
            <CarCard key={car.id} car={car} index={i} />
          ))}
        </div>
      </div>

      {/* ━━━ ROW 4: PERFIL + AVALIAÇÕES ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Perfis */}
        <div className="lg:col-span-5 bento-card scroll-reveal">
          <div className="mb-4">
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--color-text)' }}>Melhores por perfil</h3>
            <p className="text-[11px]" style={{ color: 'var(--color-text-3)' }}>Encontre o ideal para seu dia a dia</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {profiles.map((p, i) => (
              <Link
                key={p.id}
                href={`/rankings?profile=${p.id}`}
                className={`flex items-center gap-3 p-3 group scroll-reveal sr-delay-${Math.min(i + 1, 6)}`}
                style={{
                  background: 'var(--color-card-2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  transition: 'var(--transition)',
                }}
              >
                <span className="text-xl">{p.emoji}</span>
                <div>
                  <p className="text-[12px] font-bold" style={{ color: 'var(--color-text)' }}>{p.label}</p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-3)' }}>{p.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Avaliações */}
        <div className="lg:col-span-7 bento-card scroll-reveal sr-delay-1" style={{ padding: '20px 0' }}>
          <div className="flex items-center justify-between px-5 mb-4">
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: 'var(--color-text)' }}>Avaliações</h3>
              <p className="text-[11px]" style={{ color: 'var(--color-text-3)' }}>O que dizem nossos usuários</p>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-current star" />
              <span className="text-sm font-bold">4.9</span>
            </div>
          </div>
          <div className="horizontal-scroll px-5 gap-3">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="min-w-[240px] max-w-[260px] p-4 flex-shrink-0"
                style={{
                  background: 'var(--color-card-2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star
                      key={si}
                      className="w-3 h-3 fill-current"
                      style={{ color: si < r.rating ? 'var(--color-rating)' : '#E4E4E7' }}
                    />
                  ))}
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-text)' }}>
                  &ldquo;{r.text}&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                  >
                    {r.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold">{r.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-3)' }}>{r.car}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ━━━ ROW 5: CTA FINAL ━━━ */}
      <div className="bento-card-accent scroll-reveal" style={{ padding: '40px 28px', textAlign: 'center' }}>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Em dúvida entre dois carros?
        </h2>
        <p className="text-sm max-w-md mx-auto mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Compare lado a lado com destaque visual de quem vence em cada critério.
        </p>
        <Link
          href="/comparar"
          className="inline-flex items-center gap-2 px-7 py-3 font-semibold text-sm"
          style={{ background: 'white', color: 'var(--color-accent)', borderRadius: 'var(--radius-pill)' }}
        >
          Comparar agora
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  )
}
