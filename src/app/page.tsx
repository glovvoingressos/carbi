import type { Metadata } from 'next'
import Link from 'next/link'
import HeroSearchBar from '@/components/ui/HeroSearchBar'
import {
  ArrowRight,
  BarChart3,
  Camera,
  Car,
  Check,
  Gauge,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingDown,
  Users,
  Zap,
} from 'lucide-react'
import FAQSection from '@/components/layout/FAQSection'
import BrandLogo from '@/components/brand/BrandLogo'
import ListingCard from '@/components/marketplace/ListingCard'
import { getLatestPublicListings, getMarketplaceDiscoverySections } from '@/lib/marketplace-server'
import { getAllCars } from '@/lib/data-fetcher'
import { formatBRL } from '@/data/cars'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Carbi | anunciar carros grátis, seminovos à venda e FIPE',
  description: 'Anuncie carros grátis, encontre seminovos à venda e compare preço com FIPE em uma plataforma com chat interno e dados reais.',
  keywords: ['anunciar carros grátis', 'seminovos à venda', 'carros à venda', 'anunciar carro', 'vender carro', 'comprar carro', 'tabela fipe'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Carbi | anunciar carros grátis, seminovos à venda e FIPE',
    description: 'Anuncie carros grátis, encontre seminovos à venda e compare preço com FIPE em uma plataforma com chat interno e dados reais.',
    url: '/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carbi | anunciar carros grátis, seminovos à venda e FIPE',
    description: 'Anuncie carros grátis, encontre seminovos à venda e compare preço com FIPE em uma plataforma com chat interno e dados reais.',
  },
}

const QUICK_FILTERS = [
  { label: 'SUV', icon: Car, href: '/carros/suv' },
  { label: 'Sedan', icon: Car, href: '/carros/sedan' },
  { label: 'Hatch', icon: Car, href: '/carros/hatch' },
  { label: 'Picape', icon: Car, href: '/carros/pickup' },
  { label: 'Elétrico', icon: Zap, href: '/carros/eletrico' },
  { label: 'Até R$ 50k', icon: Tag, href: '/carros/ate-50-mil' },
]

const AUDIENCES = [
  'primeiro carro',
  'famílias',
  'motoristas de app',
  'SUV lovers',
  'colecionadores',
  'elétricos',
  'picapes',
  'caminhões',
  'seminovos premium',
  'baixo km',
  'automáticos',
  'hatches',
  'sedans',
  'ofertas FIPE',
]

const FEATURES = [
  {
    icon: Search,
    title: 'Ache tudo em uma busca',
    text: 'Marca, modelo, preço, quilometragem e localização em uma experiência direta, sem páginas confusas.',
  },
  {
    icon: ShieldCheck,
    title: 'Compre com contexto',
    text: 'Preço, FIPE, dados do veículo, vendedor e características ficam claros antes do primeiro contato.',
  },
  {
    icon: BarChart3,
    title: 'Decida sem ruído',
    text: 'A interface prioriza o que importa: fotos, preço, confiança, specs e ação rápida para avançar.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'A Carbi deixa a busca por seminovo simples. Eu entendi preço, FIPE e contato sem ficar pulando de tela.',
    name: 'Marina Costa',
    role: 'Compradora, Belo Horizonte',
  },
  {
    quote: 'Publiquei o carro com fotos e dados em poucos minutos. O anúncio ficou mais profissional que em classificados tradicionais.',
    name: 'Rafael Nunes',
    role: 'Vendedor particular',
  },
  {
    quote: 'O visual é limpo e rápido. Parece produto global, mas resolve um problema bem brasileiro: escolher carro com confiança.',
    name: 'Lia Andrade',
    role: 'Entusiasta automotiva',
  },
]

export default async function HomePage() {
  const cars = await getAllCars()
  const latestListings = await getLatestPublicListings(12)
  const discovery = await getMarketplaceDiscoverySections()
  const brands = [...new Set(cars.map((car) => car.brand))].sort().slice(0, 12)
  const showcaseListings = latestListings.slice(0, 8)
  const reducedListings = discovery.reduced.length > 0 ? discovery.reduced.slice(0, 4) : latestListings.slice(0, 4)
  const heroListing = latestListings[0]

  return (
    <div className="min-h-screen overflow-hidden bg-[#F3F0E7]">
      <section className="relative min-h-screen bg-[#D9F85F] px-4 pb-16 pt-28 md:pt-36">
        <div className="mx-auto mb-8 flex max-w-5xl items-center justify-center">
          <Link
            href="/carros-a-venda"
            className="inline-flex items-center gap-2 rounded-full bg-[#17170F] px-5 py-2.5 text-[13px] font-extrabold text-[#FFFDF3] shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Encontre seu arquétipo automotivo
            <span className="underline decoration-[#D9F85F] underline-offset-4">ver seminovos</span>
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>

        <div className="container">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="text-center lg:text-left">
              <h1 className="mx-auto max-w-5xl text-[64px] font-black leading-[0.88] tracking-[-0.045em] text-[#1E2330] sm:text-[88px] md:text-[112px] lg:mx-0 lg:text-[118px]">
                Seu seminovo em um só lugar.
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-[19px] font-bold leading-relaxed text-[#2F352A] md:text-[22px] lg:mx-0">
                Compre, compare e anuncie carros usados e seminovos com uma experiência rápida, amigável e poderosa.
              </p>
              <div className="mx-auto mt-8 max-w-3xl lg:mx-0">
                <HeroSearchBar />
              </div>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href="/anunciar-carro" className="btn btn-primary btn-lg">
                  Anunciar grátis
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
                <Link href="/carros-a-venda" className="btn btn-secondary btn-lg">
                  Explorar ofertas
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px]">
              <div className="absolute -left-6 top-14 h-24 w-24 rounded-full bg-[#E9C0F7]" />
              <div className="absolute -right-8 bottom-20 h-32 w-32 rounded-full bg-[#FF8A65]" />
              <div className="relative rounded-[54px] border-[10px] border-[#17170F] bg-[#FFFDF3] p-5 shadow-[18px_18px_0_rgba(23,23,15,0.18)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#857C6B]">carbi</p>
                    <p className="text-[22px] font-black leading-none text-[#17170F]">Garagem ao vivo</p>
                  </div>
                  <span className="rounded-full bg-[#D9F85F] px-3 py-1 text-[11px] font-black text-[#17170F]">online</span>
                </div>
                <div className="space-y-3">
                  {showcaseListings.slice(0, 3).map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/anuncios/${listing.slug}`}
                      className="flex items-center gap-3 rounded-[28px] border-2 border-[#17170F]/12 bg-white p-3 shadow-sm transition-transform hover:-translate-y-1 hover:bg-[#D9F85F]"
                    >
                      <div className="flex h-16 w-20 items-center justify-center rounded-2xl bg-[#F3F0E7]">
                        <Car className="h-7 w-7 text-[#17170F]" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-black text-[#17170F]">{listing.title}</p>
                        <p className="text-[12px] font-bold text-[#857C6B]">{listing.city}/{listing.state}</p>
                      </div>
                      <p className="text-right text-[13px] font-black text-[#17170F]">{formatBRL(Number(listing.price))}</p>
                    </Link>
                  ))}
                  {showcaseListings.length === 0 && (
                    <div className="rounded-[28px] border-2 border-[#17170F]/12 bg-white p-8 text-center">
                      <Car className="mx-auto mb-3 h-10 w-10 text-[#17170F]" strokeWidth={1.5} />
                      <p className="text-sm font-black text-[#17170F]">Sua vitrine de seminovos aparece aqui</p>
                    </div>
                  )}
                </div>
                <Link href="/carros-a-venda" className="mt-4 flex h-14 items-center justify-center rounded-full bg-[#17170F] text-[14px] font-black text-[#FFFDF3]">
                  Abrir marketplace
                </Link>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-14 flex max-w-5xl gap-3 overflow-x-auto pb-2 no-scrollbar md:justify-center">
            {QUICK_FILTERS.map((filter) => {
              const Icon = filter.icon
              return (
                <Link
                  key={filter.label}
                  href={filter.href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-[#17170F]/20 bg-[#FFFDF3] px-5 py-3 text-[14px] font-black text-[#17170F] shadow-sm transition-transform hover:-translate-y-1"
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                  {filter.label}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F3F0E7] py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-[48px] font-black leading-[0.95] tracking-[-0.04em] text-[#1E2330] md:text-[76px]">
              Crie, descubra e compare seminovos em minutos
            </h2>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            <div className="rounded-[48px] bg-[#E9C0F7] p-8 md:p-10">
              <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#17170F] text-[#FFFDF3]">
                <Camera className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="text-[34px] font-black leading-none tracking-[-0.03em] text-[#1E2330]">Anuncie com cara de produto premium</h3>
              <p className="mt-5 text-[16px] font-bold leading-relaxed text-[#4F4A3E]">
                Fotos, dados, preço e descrição organizados em uma apresentação limpa, direta e pronta para converter.
              </p>
              <Link href="/anunciar-carro" className="mt-8 inline-flex rounded-full bg-[#17170F] px-6 py-3 text-sm font-black text-[#FFFDF3]">
                Começar anúncio
              </Link>
            </div>

            <div className="rounded-[48px] bg-[#C7F9E5] p-8 md:p-10">
              <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#17170F] text-[#FFFDF3]">
                <Gauge className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="text-[34px] font-black leading-none tracking-[-0.03em] text-[#1E2330]">Compare o essencial antes do contato</h3>
              <p className="mt-5 text-[16px] font-bold leading-relaxed text-[#4F4A3E]">
                Quilometragem, ano, FIPE, localização e principais características aparecem com hierarquia simples.
              </p>
              <Link href="/carros-a-venda" className="mt-8 inline-flex rounded-full bg-[#17170F] px-6 py-3 text-sm font-black text-[#FFFDF3]">
                Comparar carros
              </Link>
            </div>

            <div className="rounded-[48px] bg-[#FFD1BD] p-8 md:p-10">
              <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#17170F] text-[#FFFDF3]">
                <TrendingDown className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="text-[34px] font-black leading-none tracking-[-0.03em] text-[#1E2330]">Descubra oportunidades sem esforço</h3>
              <p className="mt-5 text-[16px] font-bold leading-relaxed text-[#4F4A3E]">
                Preços abaixo da tabela, recém-anunciados e filtros de segmento ficam no caminho natural da compra.
              </p>
              <Link href="/carros/mais-baratos" className="mt-8 inline-flex rounded-full bg-[#17170F] px-6 py-3 text-sm font-black text-[#FFFDF3]">
                Ver oportunidades
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#17170F] py-16 text-[#FFFDF3]">
        <div className="flex w-max animate-[marquee_42s_linear_infinite] gap-8">
          {[...AUDIENCES, ...AUDIENCES, ...AUDIENCES].map((item, index) => (
            <span key={`${item}-${index}`} className="text-[42px] font-black leading-none tracking-[-0.035em] md:text-[72px]">
              {item}
            </span>
          ))}
        </div>
        <div className="container mt-10 text-center">
          <h2 className="mx-auto max-w-5xl text-[44px] font-black leading-[0.95] tracking-[-0.04em] text-[#FFFDF3] md:text-[78px]">
            O marketplace de seminovos para quem quer comprar, vender e decidir rápido.
          </h2>
        </div>
      </section>

      <section className="bg-[#F3F0E7] py-20 md:py-28">
        <div className="container">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-4 inline-flex rounded-full bg-[#D9F85F] px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-[#17170F]">Ao vivo agora</p>
              <h2 className="max-w-4xl text-[46px] font-black leading-[0.95] tracking-[-0.04em] text-[#1E2330] md:text-[76px]">
                Seminovos que acabaram de chegar
              </h2>
            </div>
            <Link href="/carros-a-venda" className="btn btn-primary btn-lg w-fit">
              Ver todos
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>

          {showcaseListings.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {showcaseListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-[44px] border-2 border-[#17170F]/14 bg-white p-14 text-center shadow-sm">
              <p className="text-lg font-black text-[#17170F]">Ainda não há anúncios ativos.</p>
              <Link href="/anunciar-carro" className="btn btn-primary btn-lg mt-6">
                Anunciar primeiro carro
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#D9F85F] py-20 md:py-28">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-[52px] font-black leading-[0.9] tracking-[-0.045em] text-[#1E2330] md:text-[88px]">
                Seu painel de decisão, sem complicação.
              </h2>
              <p className="mt-8 max-w-xl text-[19px] font-bold leading-relaxed text-[#2F352A]">
                A Carbi transforma anúncio, busca e contato em uma sequência simples. Menos distração. Mais ação.
              </p>
              <div className="mt-8 grid gap-3">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.title} className="rounded-[28px] border-2 border-[#17170F]/18 bg-[#FFFDF3] p-5 shadow-sm">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17170F] text-[#FFFDF3]">
                          <Icon className="h-5 w-5" strokeWidth={2.2} />
                        </span>
                        <h3 className="text-[18px] font-black text-[#17170F]">{feature.title}</h3>
                      </div>
                      <p className="text-[14px] font-bold leading-relaxed text-[#4F4A3E]">{feature.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[54px] border-[10px] border-[#17170F] bg-[#FFFDF3] p-5 shadow-[18px_18px_0_rgba(23,23,15,0.18)]">
              <div className="rounded-[36px] bg-[#E9C0F7] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#4F4A3E]">match carbi</p>
                    <p className="text-[28px] font-black leading-none text-[#17170F]">{heroListing?.brand || 'Honda'} {heroListing?.model || 'Civic'}</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-[#17170F]" strokeWidth={2} />
                </div>
                <div className="flex aspect-square items-center justify-center rounded-[34px] bg-[#FFFDF3]">
                  <Car className="h-24 w-24 text-[#17170F]" strokeWidth={1.2} />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-[22px] bg-[#FFFDF3] p-4">
                    <p className="text-[11px] font-black uppercase text-[#857C6B]">Preço</p>
                    <p className="mt-1 text-[17px] font-black text-[#17170F]">{heroListing ? formatBRL(Number(heroListing.price)) : 'R$ 89.900'}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#FFFDF3] p-4">
                    <p className="text-[11px] font-black uppercase text-[#857C6B]">KM</p>
                    <p className="mt-1 text-[17px] font-black text-[#17170F]">{heroListing ? heroListing.mileage.toLocaleString('pt-BR') : '42.000'}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#FFFDF3] p-4">
                    <p className="text-[11px] font-black uppercase text-[#857C6B]">Ano</p>
                    <p className="mt-1 text-[17px] font-black text-[#17170F]">{heroListing?.year_model || '2022'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F0E7] py-20 md:py-28">
        <div className="container">
          <div className="mx-auto mb-12 max-w-4xl text-center">
            <h2 className="text-[48px] font-black leading-[0.95] tracking-[-0.04em] text-[#1E2330] md:text-[78px]">
              Explore como quiser comprar
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Link href="/carros-a-venda" className="group min-h-[320px] rounded-[48px] bg-[#C7F9E5] p-8 transition-transform hover:-translate-y-2">
              <Search className="mb-16 h-10 w-10 text-[#17170F]" strokeWidth={2.25} />
              <h3 className="text-[32px] font-black leading-none tracking-[-0.03em] text-[#17170F]">Buscar seminovos por preço, marca e cidade</h3>
              <ArrowRight className="mt-8 h-6 w-6 transition-transform group-hover:translate-x-2" strokeWidth={2.5} />
            </Link>
            <Link href="/carros/mais-baratos" className="group min-h-[320px] rounded-[48px] bg-[#E9C0F7] p-8 transition-transform hover:-translate-y-2">
              <TrendingDown className="mb-16 h-10 w-10 text-[#17170F]" strokeWidth={2.25} />
              <h3 className="text-[32px] font-black leading-none tracking-[-0.03em] text-[#17170F]">Encontrar carros abaixo da FIPE</h3>
              <ArrowRight className="mt-8 h-6 w-6 transition-transform group-hover:translate-x-2" strokeWidth={2.5} />
            </Link>
            <Link href="/anunciar-carro" className="group min-h-[320px] rounded-[48px] bg-[#FFD1BD] p-8 transition-transform hover:-translate-y-2">
              <Tag className="mb-16 h-10 w-10 text-[#17170F]" strokeWidth={2.25} />
              <h3 className="text-[32px] font-black leading-none tracking-[-0.03em] text-[#17170F]">Vender seu carro com vitrine premium</h3>
              <ArrowRight className="mt-8 h-6 w-6 transition-transform group-hover:translate-x-2" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {reducedListings.length > 0 && (
        <section className="bg-[#FFF8DF] py-20 md:py-28">
          <div className="container">
            <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <h2 className="max-w-4xl text-[48px] font-black leading-[0.95] tracking-[-0.04em] text-[#1E2330] md:text-[78px]">
                Ofertas que merecem atenção
              </h2>
              <Link href="/carros/mais-baratos" className="btn btn-primary btn-lg w-fit">
                Ver oportunidades
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {reducedListings.map((listing) => (
                <ListingCard key={`drop-${listing.id}`} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#F3F0E7] py-20 md:py-28">
        <div className="container">
          <div className="mx-auto mb-12 max-w-4xl text-center">
            <h2 className="text-[48px] font-black leading-[0.95] tracking-[-0.04em] text-[#1E2330] md:text-[78px]">
              Marcas para começar sua busca
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {brands.map((brand) => {
              const slug = brand.toLowerCase().replace(/\s+/g, '-')
              return (
                <Link
                  key={brand}
                  href={`/marcas/${slug}`}
                  className="flex min-h-36 flex-col items-center justify-center rounded-[34px] border-2 border-[#17170F]/12 bg-white p-5 text-center shadow-sm transition-transform hover:-translate-y-1 hover:bg-[#D9F85F]"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center">
                    <BrandLogo brandName={brand} domain={`${slug}.com`} className="h-full w-full object-contain" />
                  </div>
                  <span className="text-[13px] font-black text-[#17170F]">{brand}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#17170F] py-20 text-[#FFFDF3] md:py-28">
        <div className="container">
          <h2 className="mx-auto max-w-5xl text-center text-[48px] font-black leading-[0.95] tracking-[-0.04em] text-[#FFFDF3] md:text-[78px]">
            O jeito rápido, amigável e poderoso de comprar e vender seminovos.
          </h2>
          <div className="mt-10 flex justify-center">
            <Link href="/carros-a-venda" className="rounded-full bg-[#E9C0F7] px-10 py-5 text-[16px] font-black text-[#17170F] transition-transform hover:-translate-y-1">
              Explorar marketplace
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F0E7] py-20 md:py-28">
        <div className="container">
          <h2 className="mb-12 text-center text-[48px] font-black leading-[0.95] tracking-[-0.04em] text-[#1E2330] md:text-[72px]">
            Histórias de quem usa
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.name} className="rounded-[42px] border-2 border-[#17170F]/12 bg-white p-8 shadow-sm">
                <p className="text-[22px] font-black leading-tight tracking-[-0.02em] text-[#17170F]">“{testimonial.quote}”</p>
                <div className="mt-10 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D9F85F]">
                    <Users className="h-5 w-5 text-[#17170F]" strokeWidth={2.25} />
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-[#17170F]">{testimonial.name}</p>
                    <p className="text-[12px] font-bold text-[#857C6B]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#D9F85F] px-4 py-20 md:py-28">
        <div className="mx-auto max-w-6xl rounded-[56px] bg-[#17170F] p-8 text-center text-[#FFFDF3] md:p-16">
          <h2 className="mx-auto max-w-4xl text-[52px] font-black leading-[0.9] tracking-[-0.045em] text-[#FFFDF3] md:text-[92px]">
            Comece seu próximo capítulo sobre rodas hoje.
          </h2>
          <div className="mx-auto mt-10 max-w-2xl">
            <HeroSearchBar />
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/anunciar-carro" className="rounded-full bg-[#E9C0F7] px-8 py-4 text-[15px] font-black text-[#17170F]">
              Anunciar grátis
            </Link>
            <Link href="/qual-carro" className="rounded-full border-2 border-[#FFFDF3]/20 px-8 py-4 text-[15px] font-black text-[#FFFDF3]">
              Descobrir meu carro ideal
            </Link>
          </div>
        </div>
      </section>

      <FAQSection />
    </div>
  )
}
