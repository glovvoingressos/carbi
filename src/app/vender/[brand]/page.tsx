import { Metadata } from 'next'
import SEOPageClient from '@/components/seo/SEOPageClient'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'
import { getAllCars } from '@/lib/data-fetcher'
import { slugifyBrand } from '@/lib/brand-utils'
import { BreadcrumbSchema, FAQSchema } from '@/components/seo/JSONLD'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

// Marcas que precisam de caixa alta
const upperCaseBrands = new Set(['ram', 'bmw', 'byd', 'gwm', 'gac'])

// Marcas chinesas com conteúdo específico
const chineseBrandInfo: Record<string, { description: string; highlights: string[] }> = {
  'jaecoo': {
    description: 'Jaecoo é a marca premium da Chery, trazendo SUVs modernos com design arrojado e tecnologia embarcada para o Brasil.',
    highlights: ['SUVs com design premium', 'Tecnologia embarcada', 'Garantia de 5 anos', 'Peças de reposição disponíveis'],
  },
  'gac': {
    description: 'GAC Motor traz veículos chineses com qualidade comprovada e preço competitivo para o mercado brasileiro.',
    highlights: ['Custo-benefício excelente', 'Equipamentos de série', 'Garantia de fábrica', 'Rede de assistência'],
  },
  'geely': {
    description: 'Geely é uma das maiores montadoras chinesas, dona da Volvo, trazendo inovação e qualidade para o Brasil.',
    highlights: ['Tecnologia Volvo', 'Design moderno', 'Segurança premium', 'Inovação constante'],
  },
  'gwm': {
    description: 'GWM (Great Wall Motors) oferece SUVs e pickups robustos com tecnologia avançada e preço competitivo.',
    highlights: ['SUVs robustos', 'Híbridos e elétricos', '4x4 acessível', 'Tecnologia embarcada'],
  },
  'omoda': {
    description: 'Omoda é a marca de design da Chery, com SUVs que combinam estilo arrojado e tecnologia moderna.',
    highlights: ['Design arrojado', 'Tecnologia embarcada', 'Preço competitivo', 'Garantia estendida'],
  },
  'caoa-chery': {
    description: 'CAOA Chery é a joint venture da Chery no Brasil, oferecendo veículos com qualidade e garantia local.',
    highlights: ['Montagem nacional', 'Garantia de 5 anos', 'Rede própria', 'Peças disponíveis'],
  },
  'chery': {
    description: 'Chery é uma das maiores exportadoras chinesas, com veículos testados em mais de 80 países.',
    highlights: ['Qualidade global', 'Preço competitivo', 'Tecnologia embarcada', 'Garantia de 5 anos'],
  },
  'leapmotor': {
    description: 'Leapmotor é uma joint venture com a Stellantis, trazendo elétricos acessíveis para o Brasil.',
    highlights: ['Elétricos acessíveis', 'Tecnologia Stellantis', 'Design moderno', 'Inovação em mobilidade'],
  },
  'jetour': {
    description: 'Jetour é a marca de viagem da Chery, oferecendo SUVs spacious e confortáveis para famílias.',
    highlights: ['SUVs spacious', 'Conforto familiar', 'Tecnologia embarcada', 'Preço competitivo'],
  },
  'wey': {
    description: 'Wey é a marca premium da GWM, trazendo luxo e tecnologia acessível para o mercado brasileiro.',
    highlights: ['Luxo acessível', 'Tecnologia avançada', 'Design sofisticado', 'Segurança 5 estrelas'],
  },
  'haval': {
    description: 'Haval é a marca de SUVs da GWM, reconhecida mundialmente por veículos robustos e confiáveis.',
    highlights: ['SUVs globais', '4x4 acessível', 'Tecnologia embarcada', 'Milhões vendidos no mundo'],
  },
}

// Marcas elétricas/híbridas
const evBrands = new Set(['byd', 'gwm', 'volvo', 'bmw', 'porsche', 'audi', 'chevrolet', 'geely', 'leapmotor'])
const hybridBrands = new Set(['byd', 'gwm', 'jaecoo'])

function titleCase(value: string) {
  const normalized = value.toLowerCase()
  if (upperCaseBrands.has(normalized)) {
    return normalized.toUpperCase()
  }
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export async function generateStaticParams() {
  try {
    const cars = await getAllCars()
    const uniqueBrands = Array.from(new Set(cars.map((car) => slugifyBrand(car.brand)))).filter(Boolean)
    return uniqueBrands.map((brand) => ({ brand }))
  } catch (error) {
    console.error('Erro ao gerar static params para marcas de venda:', error)
    return []
  }
}

export const dynamicParams = true

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand } = await params
  const capitalizedBrand = titleCase(brand)
  const canonicalUrl = `${SITE_URL}/vender/${brand}`
  const isEv = evBrands.has(brand.toLowerCase())
  const isHybrid = hybridBrands.has(brand.toLowerCase())

  const evSuffix = isEv ? ' Elétrico' : isHybrid ? ' Híbrido' : ''

  return {
    title: `Vender ${capitalizedBrand}${evSuffix}: Anuncie seu ${capitalizedBrand} rápido na Carbi`,
    description: `Quer vender seu ${capitalizedBrand}${evSuffix}? Na Carbi você anuncia seu ${capitalizedBrand} usado ou seminovo com segurança e alcança compradores reais em todo o Brasil.`,
    keywords: [
      `vender ${capitalizedBrand}`,
      `anunciar ${capitalizedBrand}`,
      'vender carro',
      'anunciar carro grátis',
      'seminovos à venda',
      isEv ? 'carro elétrico' : '',
      isHybrid ? 'carro híbrido' : '',
    ].filter(Boolean),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Vender ${capitalizedBrand}${evSuffix}: Anuncie seu ${capitalizedBrand} rápido na Carbi`,
      description: `Quer vender seu ${capitalizedBrand}${evSuffix}? Na Carbi você anuncia com segurança e alcança compradores reais.`,
      type: 'website',
      url: canonicalUrl,
    },
  }
}

export default async function VenderBrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params
  const capitalizedBrand = titleCase(brand)
  const brandLower = brand.toLowerCase()
  const { items } = await fetchPublicListingsPage({ brand: `%${capitalizedBrand}%`, page: 1, pageSize: 24, sort: 'recent' })

  const brandInfo = chineseBrandInfo[brandLower]
  const isEv = evBrands.has(brandLower)
  const isHybrid = hybridBrands.has(brandLower)

  const brandDescription = brandInfo?.description || `A ${capitalizedBrand} é uma marca reconhecida no mercado automotivo brasileiro, oferecendo veículos de qualidade para todos os perfis de compradores.`
  const brandHighlights = brandInfo?.highlights || ['Qualidade comprovada', 'Rede de assistência', 'Peças disponíveis', 'Garantia de fábrica']

  const data = {
    h1: `Vender ${capitalizedBrand} Rápido e Seguro`,
    subtitle: brandDescription,
    ctaButtonText: `Anunciar meu ${capitalizedBrand}`,
    benefits: [
      { icon: 'BadgeDollarSign', title: 'Valorização real', description: `Compare seu ${capitalizedBrand} com anúncios ativos e a FIPE para precificar melhor.` },
      { icon: 'Car', title: `${items.length} anúncios ativos`, description: `Veja demanda real por ${capitalizedBrand} na plataforma antes de publicar.` },
      { icon: 'ShieldCheck', title: 'Venda direta', description: 'Conectamos você a compradores reais, com chat interno e sem expor contato.' },
      ...(isEv ? [{ icon: 'Zap', title: 'Elétricos', description: 'Destaque para veículos elétricos com autonomia e custo por km.' }] : []),
      ...(isHybrid ? [{ icon: 'Leaf', title: 'Híbridos', description: 'Destaque para veículos híbridos com economia de combustível.' }] : []),
    ],
    sections: [
      {
        badge: 'Sobre a marca',
        title: `Por que escolher ${capitalizedBrand}`,
        subtitle: brandDescription,
        content: `A ${capitalizedBrand} se destaca por: ${brandHighlights.join(', ')}. Na Carbi, você encontra compradores interessados em veículos da marca.`,
      },
      {
        badge: 'Mercado atual',
        title: `Como está a procura por ${capitalizedBrand}`,
        subtitle: `Os anúncios ativos mostram a janela de preço e demanda da marca.`,
        content: `Hoje há ${items.length} anúncio(s) ativo(s) de ${capitalizedBrand} na plataforma. Use essa vitrine para ajustar o preço e publicar com mais confiança.`,
      },
      {
        badge: 'Guia de venda',
        title: `Como vender seu ${capitalizedBrand} pelo melhor preço`,
        subtitle: `Preço justo e fotos reais aceleram o fechamento.`,
        content: `Ao anunciar na Carbi, seu ${capitalizedBrand} entra no mesmo fluxo de descoberta que os compradores já usam para pesquisar seminovos e carros usados.`,
      },
    ],
    faqs: [
      { q: `É fácil vender um ${capitalizedBrand} usado?`, a: `Sim. O fluxo de anúncio é rápido e o contato com interessados acontece pelo chat interno.` },
      { q: `Como avaliar meu ${capitalizedBrand}?`, a: 'Use a comparação com FIPE e a régua de anúncios ativos da própria plataforma.' },
      { q: 'Quanto tempo demora para vender?', a: `Depende do preço e da demanda, mas anúncios bem posicionados tendem a receber contato rápido.` },
      ...(isEv ? [{ q: 'É difícil vender um carro elétrico?', a: 'Não. A demanda por elétricos está crescendo. Na Carbi, compradores especializados buscam ativamente veículos elétricos.' }] : []),
      ...(isHybrid ? [{ q: 'Carros híbridos têm boa saída?', a: 'Sim. Híbridos são muito procurados por quem busca economia sem abrir mão da autonomia.' }] : []),
    ],
  }

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Vender Carro', url: '/vender-carro' },
          { name: `Vender ${capitalizedBrand}`, url: `/vender/${brand}` },
        ]}
      />
      <FAQSchema items={data.faqs} />
      <SEOPageClient data={data} ctaHref="/anunciar-carro" />
    </>
  )
}
