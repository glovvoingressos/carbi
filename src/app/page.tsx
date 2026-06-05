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
    <div className="min-h-screen overflow-x-clip bg-[#F3F0E7]">
      <section className="relative min-h-screen overflow-x-clip bg-[#D9F85F] px-4 pb-14 pt-24 sm:pt-28 md:pb-16 md:pt-36">
        <div className="container">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="text-center lg:text-left">
              <h1 className="mx-auto max-w-[10ch] text-[38px] font-black leading-[0.94] tracking-normal text-[#1E2330] text-balance max-[360px]:max-w-[9ch] max-[360px]:text-[34px] max-[330px]:text-[30px] sm:max-w-5xl sm:text-[64px] md:text-[88px] lg:mx-0 lg:text-[118px]">
                <span className="block sm:inline">Seu seminovo</span>
                <span className="block sm:inline sm:ml-2">em um só lugar.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-[15px] font-bold leading-relaxed text-[#2F352A] max-[360px]:mt-4 max-[360px]:text-[14px] sm:mt-8 sm:text-[19px] md:text-[22px] lg:mx-0">
                Compre, compare e anuncie carros usados e seminovos com uma experiência rápida, amigável e poderosa.
              </p>
              <div className="mx-auto mt-5 max-w-3xl lg:mx-0">
                <HeroSearchBar />
              </div>
              <div className="mx-auto mt-5 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center lg:mx-0 lg:justify-start">
                <Link href="/anunciar-carro" className="btn btn-primary btn-lg max-[360px]:px-4 max-[360px]:text-[14px]">
                  Anunciar grátis
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
                <Link href="/carros-a-venda" className="btn btn-secondary btn-lg max-[360px]:px-4 max-[360px]:text-[14px]">
                  Explorar ofertas
                </Link>
              </div>
            </div>

            <div className="relative mx-auto hidden w-full max-w-[520px] lg:block">
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

          <div className="mx-auto mt-8 grid max-w-5xl gap-3 lg:hidden sm:grid-cols-2 max-[330px]:mt-6 max-[330px]:gap-2">
            <div className="rounded-[28px] border-2 border-[#17170F]/14 bg-[#FFFDF3] p-4 shadow-sm max-[330px]:rounded-[22px] max-[330px]:p-3">
              <p className="text-[11px] font-black uppercase tracking-normal text-[#857C6B] max-[330px]:text-[10px]">agora ao vivo</p>
              <p className="mt-2 text-[18px] font-black leading-tight text-[#17170F] max-[330px]:text-[15px]">Anúncios novos todos os dias</p>
              <p className="mt-2 text-[13px] font-bold leading-relaxed text-[#4F4A3E]">
                Navegue por ofertas reais e encontre o carro certo com menos esforço.
              </p>
            </div>
            <div
              className="rounded-[28px] border-2 border-[#17170F]/14 bg-[#17170F] p-4 shadow-sm max-[330px]:rounded-[22px] max-[330px]:p-3"
              style={{ color: '#FFFDF3' }}
            >
              <p className="text-[11px] font-black uppercase tracking-normal max-[330px]:text-[10px]" style={{ color: '#D9F85F' }}>
                fipe em destaque
              </p>
              <p className="mt-2 text-[18px] font-black leading-tight max-[330px]:text-[15px]" style={{ color: '#FFFDF3' }}>
                Compare antes de chamar
              </p>
              <p className="mt-2 text-[13px] font-bold leading-relaxed max-[330px]:text-[12px]" style={{ color: '#E7E4DA' }}>
                Veja o preço pedido e a referência de mercado com clareza no celular.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-14 flex max-w-5xl gap-3 overflow-x-auto pb-2 no-scrollbar md:justify-center max-[330px]:mt-8 max-[330px]:gap-2">
            {QUICK_FILTERS.map((filter) => {
              const Icon = filter.icon
              return (
                <Link
                  key={filter.label}
                  href={filter.href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-[#17170F]/20 bg-[#FFFDF3] px-5 py-3 text-[14px] font-black text-[#17170F] shadow-sm transition-transform hover:-translate-y-1 max-[330px]:px-3 max-[330px]:py-2 max-[330px]:text-[12px]"
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                  {filter.label}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F3F0E7] py-20 md:py-28 max-[330px]:py-14">
        <div className="container">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-[48px] font-black leading-[0.95] tracking-normal text-[#1E2330] max-[330px]:text-[28px] md:text-[76px]">
              Crie, descubra e compare seminovos em minutos
            </h2>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3 max-[330px]:mt-8 max-[330px]:gap-3">
            <div className="rounded-[48px] bg-[#E9C0F7] p-8 md:p-10 max-[330px]:rounded-[26px] max-[330px]:p-4">
              <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#17170F] text-[#FFFDF3] max-[330px]:mb-5 max-[330px]:h-10 max-[330px]:w-10">
                <Camera className="h-7 w-7 max-[330px]:h-5 max-[330px]:w-5" strokeWidth={2} />
              </div>
              <h3 className="text-[34px] font-black leading-tight tracking-normal text-[#1E2330] max-[330px]:text-[20px]">Anuncie com cara de produto premium</h3>
              <p className="mt-5 text-[16px] font-bold leading-relaxed text-[#4F4A3E] max-[330px]:mt-3 max-[330px]:text-[13px]">
                Fotos, dados, preço e descrição organizados em uma apresentação limpa, direta e pronta para converter.
              </p>
              <Link href="/anunciar-carro" className="mt-8 inline-flex rounded-full bg-[#17170F] px-6 py-3 text-sm font-black text-[#FFFDF3] max-[330px]:mt-5 max-[330px]:px-4 max-[330px]:py-2.5 max-[330px]:text-[12px]">
                Começar anúncio
              </Link>
            </div>

            <div className="rounded-[48px] bg-[#C7F9E5] p-8 md:p-10 max-[330px]:rounded-[26px] max-[330px]:p-4">
              <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#17170F] text-[#FFFDF3] max-[330px]:mb-5 max-[330px]:h-10 max-[330px]:w-10">
                <Gauge className="h-7 w-7 max-[330px]:h-5 max-[330px]:w-5" strokeWidth={2} />
              </div>
              <h3 className="text-[34px] font-black leading-tight tracking-normal text-[#1E2330] max-[330px]:text-[20px]">Compare o essencial antes do contato</h3>
              <p className="mt-5 text-[16px] font-bold leading-relaxed text-[#4F4A3E] max-[330px]:mt-3 max-[330px]:text-[13px]">
                Quilometragem, ano, FIPE, localização e principais características aparecem com hierarquia simples.
              </p>
              <Link href="/carros-a-venda" className="mt-8 inline-flex rounded-full bg-[#17170F] px-6 py-3 text-sm font-black text-[#FFFDF3] max-[330px]:mt-5 max-[330px]:px-4 max-[330px]:py-2.5 max-[330px]:text-[12px]">
                Comparar carros
              </Link>
            </div>

            <div className="rounded-[48px] bg-[#FFD1BD] p-8 md:p-10 max-[330px]:rounded-[26px] max-[330px]:p-4">
              <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#17170F] text-[#FFFDF3] max-[330px]:mb-5 max-[330px]:h-10 max-[330px]:w-10">
                <TrendingDown className="h-7 w-7 max-[330px]:h-5 max-[330px]:w-5" strokeWidth={2} />
              </div>
              <h3 className="text-[34px] font-black leading-tight tracking-normal text-[#1E2330] max-[330px]:text-[20px]">Descubra oportunidades sem esforço</h3>
              <p className="mt-5 text-[16px] font-bold leading-relaxed text-[#4F4A3E] max-[330px]:mt-3 max-[330px]:text-[13px]">
                Preços abaixo da tabela, recém-anunciados e filtros de segmento ficam no caminho natural da compra.
              </p>
              <Link href="/carros/mais-baratos" className="mt-8 inline-flex rounded-full bg-[#17170F] px-6 py-3 text-sm font-black text-[#FFFDF3] max-[330px]:mt-5 max-[330px]:px-4 max-[330px]:py-2.5 max-[330px]:text-[12px]">
                Ver oportunidades
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#17170F] py-8 text-[#FFFDF3] md:py-12">
        <div className="flex w-max animate-[marquee_42s_linear_infinite] gap-4 md:gap-8">
          {[...AUDIENCES, ...AUDIENCES, ...AUDIENCES].map((item, index) => (
            <span key={`${item}-${index}`} className="text-[30px] font-black leading-none tracking-normal md:text-[72px]">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-[#F3F0E7] py-20 md:py-28 max-[330px]:py-14">
        <div className="container">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between max-[330px]:mb-6">
            <div>
              <p className="mb-4 inline-flex rounded-full bg-[#D9F85F] px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-[#17170F]">Ao vivo agora</p>
              <h2 className="max-w-4xl text-[46px] font-black leading-[0.95] tracking-normal text-[#1E2330] max-[330px]:text-[28px] md:text-[76px]">
                Seminovos que acabaram de chegar
              </h2>
            </div>
            <Link href="/carros-a-venda" className="btn btn-primary btn-lg w-fit max-[330px]:w-full">
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
            <div className="rounded-[44px] border-2 border-[#17170F]/14 bg-white p-14 text-center shadow-sm max-[330px]:rounded-[24px] max-[330px]:p-5">
              <p className="text-lg font-black text-[#17170F]">Ainda não há anúncios ativos.</p>
              <Link href="/anunciar-carro" className="btn btn-primary btn-lg mt-6">
                Anunciar primeiro carro
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#D9F85F] py-20 md:py-28 max-[330px]:py-14">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center max-[330px]:gap-6">
            <div>
              <h2 className="text-[52px] font-black leading-[0.9] tracking-normal text-[#1E2330] max-[330px]:text-[30px] md:text-[88px]">
                Seu painel de decisão, sem complicação.
              </h2>
              <p className="mt-8 max-w-xl text-[19px] font-bold leading-relaxed text-[#2F352A] max-[330px]:mt-4 max-[330px]:text-[14px]">
                A Carbi transforma anúncio, busca e contato em uma sequência simples. Menos distração. Mais ação.
              </p>
              <div className="mt-8 grid gap-3 max-[330px]:mt-4 max-[330px]:gap-2">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.title} className="rounded-[28px] border-2 border-[#17170F]/18 bg-[#FFFDF3] p-5 shadow-sm max-[330px]:rounded-[22px] max-[330px]:p-3">
                      <div className="mb-3 flex items-center gap-3 max-[330px]:mb-2 max-[330px]:gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17170F] text-[#FFFDF3] max-[330px]:h-8 max-[330px]:w-8">
                          <Icon className="h-5 w-5 max-[330px]:h-4 max-[330px]:w-4" strokeWidth={2.2} />
                        </span>
                        <h3 className="text-[18px] font-black text-[#17170F] max-[330px]:text-[14px]">{feature.title}</h3>
                      </div>
                      <p className="text-[14px] font-bold leading-relaxed text-[#4F4A3E] max-[330px]:text-[12px]">{feature.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[54px] border-[10px] border-[#17170F] bg-[#FFFDF3] p-5 shadow-[18px_18px_0_rgba(23,23,15,0.18)] max-[330px]:rounded-[28px] max-[330px]:border-[6px] max-[330px]:p-3">
              <div className="rounded-[36px] bg-[#E9C0F7] p-6 max-[330px]:rounded-[22px] max-[330px]:p-3">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-normal text-[#4F4A3E] max-[330px]:text-[10px]">match carbi</p>
                    <p className="text-[28px] font-black leading-none text-[#17170F] max-[330px]:text-[18px]">{heroListing?.brand || 'Honda'} {heroListing?.model || 'Civic'}</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-[#17170F] max-[330px]:h-6 max-[330px]:w-6" strokeWidth={2} />
                </div>
                <div className="flex aspect-square items-center justify-center rounded-[34px] bg-[#FFFDF3]">
                  <Car className="h-24 w-24 text-[#17170F] max-[330px]:h-14 max-[330px]:w-14" strokeWidth={1.2} />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 max-[330px]:mt-3 max-[330px]:gap-2">
                  <div className="rounded-[22px] bg-[#FFFDF3] p-4 max-[330px]:rounded-[18px] max-[330px]:p-2.5">
                    <p className="text-[11px] font-black uppercase text-[#857C6B] max-[330px]:text-[9px]">Preço</p>
                    <p className="mt-1 text-[17px] font-black text-[#17170F] max-[330px]:text-[12px]">{heroListing ? formatBRL(Number(heroListing.price)) : 'R$ 89.900'}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#FFFDF3] p-4 max-[330px]:rounded-[18px] max-[330px]:p-2.5">
                    <p className="text-[11px] font-black uppercase text-[#857C6B] max-[330px]:text-[9px]">KM</p>
                    <p className="mt-1 text-[17px] font-black text-[#17170F] max-[330px]:text-[12px]">{heroListing ? heroListing.mileage.toLocaleString('pt-BR') : '42.000'}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#FFFDF3] p-4 max-[330px]:rounded-[18px] max-[330px]:p-2.5">
                    <p className="text-[11px] font-black uppercase text-[#857C6B] max-[330px]:text-[9px]">Ano</p>
                    <p className="mt-1 text-[17px] font-black text-[#17170F] max-[330px]:text-[12px]">{heroListing?.year_model || '2022'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F0E7] py-20 md:py-28 max-[330px]:py-14">
        <div className="container">
          <div className="mx-auto mb-12 max-w-4xl text-center max-[330px]:mb-6">
            <h2 className="text-[48px] font-black leading-[0.95] tracking-normal text-[#1E2330] max-[330px]:text-[28px] md:text-[78px]">
              Explore como quiser comprar
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3 max-[330px]:gap-3">
            <Link href="/carros-a-venda" className="group min-h-[320px] rounded-[48px] bg-[#C7F9E5] p-8 transition-transform hover:-translate-y-2 max-[330px]:min-h-0 max-[330px]:rounded-[26px] max-[330px]:p-4">
              <Search className="mb-16 h-10 w-10 text-[#17170F] max-[330px]:mb-8 max-[330px]:h-7 max-[330px]:w-7" strokeWidth={2.25} />
              <h3 className="text-[32px] font-black leading-tight tracking-normal text-[#17170F] max-[330px]:text-[18px]">Buscar seminovos por preço, marca e cidade</h3>
              <ArrowRight className="mt-8 h-6 w-6 transition-transform group-hover:translate-x-2 max-[330px]:mt-5 max-[330px]:h-5 max-[330px]:w-5" strokeWidth={2.5} />
            </Link>
            <Link href="/carros/mais-baratos" className="group min-h-[320px] rounded-[48px] bg-[#E9C0F7] p-8 transition-transform hover:-translate-y-2 max-[330px]:min-h-0 max-[330px]:rounded-[26px] max-[330px]:p-4">
              <TrendingDown className="mb-16 h-10 w-10 text-[#17170F] max-[330px]:mb-8 max-[330px]:h-7 max-[330px]:w-7" strokeWidth={2.25} />
              <h3 className="text-[32px] font-black leading-tight tracking-normal text-[#17170F] max-[330px]:text-[18px]">Encontrar carros abaixo da FIPE</h3>
              <ArrowRight className="mt-8 h-6 w-6 transition-transform group-hover:translate-x-2 max-[330px]:mt-5 max-[330px]:h-5 max-[330px]:w-5" strokeWidth={2.5} />
            </Link>
            <Link href="/anunciar-carro" className="group min-h-[320px] rounded-[48px] bg-[#FFD1BD] p-8 transition-transform hover:-translate-y-2 max-[330px]:min-h-0 max-[330px]:rounded-[26px] max-[330px]:p-4">
              <Tag className="mb-16 h-10 w-10 text-[#17170F] max-[330px]:mb-8 max-[330px]:h-7 max-[330px]:w-7" strokeWidth={2.25} />
              <h3 className="text-[32px] font-black leading-tight tracking-normal text-[#17170F] max-[330px]:text-[18px]">Vender seu carro com vitrine premium</h3>
              <ArrowRight className="mt-8 h-6 w-6 transition-transform group-hover:translate-x-2 max-[330px]:mt-5 max-[330px]:h-5 max-[330px]:w-5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {reducedListings.length > 0 && (
        <section className="bg-[#FFF8DF] py-20 md:py-28 max-[330px]:py-14">
          <div className="container">
            <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between max-[330px]:mb-6">
              <h2 className="max-w-4xl text-[48px] font-black leading-[0.95] tracking-normal text-[#1E2330] max-[330px]:text-[28px] md:text-[78px]">
                Ofertas que merecem atenção
              </h2>
              <Link href="/carros/mais-baratos" className="btn btn-primary btn-lg w-fit max-[330px]:w-full">
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

      <section className="bg-[#F3F0E7] py-20 md:py-28 max-[330px]:py-14">
        <div className="container">
          <div className="mx-auto mb-12 max-w-4xl text-center max-[330px]:mb-6">
            <h2 className="text-[48px] font-black leading-[0.95] tracking-normal text-[#1E2330] max-[330px]:text-[28px] md:text-[78px]">
              Marcas para começar sua busca
            </h2>
            <p className="mt-4 text-[16px] font-bold text-[#4F4A3E] max-[330px]:text-[13px]">
              Clique em uma marca para ver todos os anúncios disponíveis
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 max-[330px]:gap-2.5">
            {brands.map((brand) => {
              const slug = brand.toLowerCase().replace(/\s+/g, '-')
              return (
                <Link
                  key={brand}
                  href={`/carros-a-venda?brand=${encodeURIComponent(brand)}`}
                  className="flex min-h-36 flex-col items-center justify-center rounded-[34px] border-2 border-[#17170F]/12 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:bg-[#D9F85F] hover:shadow-md hover:border-[#17170F]/30 max-[330px]:min-h-28 max-[330px]:rounded-[24px] max-[330px]:p-3"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center max-[330px]:mb-2 max-[330px]:h-10 max-[330px]:w-10">
                    <BrandLogo brandName={brand} domain={`${slug}.com`} className="h-full w-full object-contain" />
                  </div>
                  <span className="text-[13px] font-black text-[#17170F] max-[330px]:text-[11px]">{brand}</span>
                  <span className="text-[10px] font-bold text-[#857C6B] mt-1">Ver anúncios →</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#17170F] py-20 text-[#FFFDF3] md:py-28 max-[330px]:py-8">
        <div className="container" style={{ color: '#FFFDF3' }}>
          <p className="mb-4 text-center text-[12px] font-black uppercase tracking-normal text-[#D9F85F] max-[330px]:mb-3">
            Marketplace em destaque
          </p>
          <h2
            className="mx-auto max-w-5xl text-center text-[48px] font-black leading-[0.95] tracking-normal max-[330px]:text-[22px] max-[330px]:leading-tight md:text-[78px]"
            style={{ color: '#FFFDF3' }}
          >
            O jeito rápido, amigável e poderoso de comprar e vender seminovos.
          </h2>
          <div className="mt-10 flex justify-center max-[330px]:mt-4">
            <Link href="/carros-a-venda" className="rounded-full bg-[#E9C0F7] px-10 py-5 text-[16px] font-black text-[#17170F] transition-transform hover:-translate-y-1 max-[330px]:px-5 max-[330px]:py-3 max-[330px]:text-[13px]">
              Explorar marketplace
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F0E7] py-20 md:py-28 max-[330px]:py-14">
        <div className="container">
          <h2 className="mb-12 text-center text-[48px] font-black leading-[0.95] tracking-normal text-[#1E2330] max-[330px]:mb-6 max-[330px]:text-[28px] md:text-[72px]">
            Histórias de quem usa
          </h2>
          <div className="grid gap-5 md:grid-cols-3 max-[330px]:gap-3">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.name} className="rounded-[42px] border-2 border-[#17170F]/12 bg-white p-8 shadow-sm max-[330px]:rounded-[24px] max-[330px]:p-4">
                <p className="text-[22px] font-black leading-tight tracking-normal text-[#17170F] max-[330px]:text-[16px]">“{testimonial.quote}”</p>
                <div className="mt-10 flex items-center gap-3 max-[330px]:mt-4 max-[330px]:gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D9F85F] max-[330px]:h-9 max-[330px]:w-9">
                    <Users className="h-5 w-5 text-[#17170F] max-[330px]:h-4 max-[330px]:w-4" strokeWidth={2.25} />
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-[#17170F] max-[330px]:text-[12px]">{testimonial.name}</p>
                    <p className="text-[12px] font-bold text-[#857C6B] max-[330px]:text-[10px]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#D9F85F] px-4 py-20 md:py-28 max-[330px]:px-3 max-[330px]:py-10">
        <div className="mx-auto max-w-6xl rounded-[56px] bg-[#17170F] p-8 text-center text-[#FFFDF3] md:p-16 max-[330px]:rounded-[28px] max-[330px]:p-4" style={{ color: '#FFFDF3' }}>
          <h2
            className="mx-auto max-w-4xl text-[52px] font-black leading-[0.9] tracking-normal max-[330px]:text-[24px] max-[330px]:leading-tight md:text-[92px]"
            style={{ color: '#FFFDF3' }}
          >
            Comece seu próximo capítulo sobre rodas hoje.
          </h2>
          <div className="mx-auto mt-10 max-w-2xl max-[330px]:mt-5">
            <HeroSearchBar />
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row max-[330px]:mt-4 max-[330px]:gap-2">
            <Link href="/anunciar-carro" className="rounded-full bg-[#E9C0F7] px-8 py-4 text-[15px] font-black text-[#17170F] max-[330px]:px-5 max-[330px]:py-3 max-[330px]:text-[13px]">
              Anunciar grátis
            </Link>
            <Link href="/qual-carro" className="rounded-full border-2 border-[#FFFDF3]/20 px-8 py-4 text-[15px] font-black text-[#FFFDF3] max-[330px]:px-5 max-[330px]:py-3 max-[330px]:text-[13px]">
              Descobrir meu carro ideal
            </Link>
          </div>
        </div>
      </section>

      <FAQSection />
    </div>
  )
}
