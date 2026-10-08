import type { Metadata } from 'next'
import type { ListingsPageInput, TruckListingFilters } from '@/lib/marketplace-server'
import { MAJOR_CITIES } from '@/lib/marketplace-seo'

export const TRUCK_BRANDS = ['Mercedes-Benz', 'Volvo', 'Scania', 'Volkswagen', 'Ford', 'Iveco']
export const TRUCK_CATEGORIES = [
  { slug: 'truck', name: 'Caminhões truck' },
  { slug: 'bitruck', name: 'Bitrucks' },
  { slug: 'cavalo-mecanico', name: 'Cavalos mecânicos' },
  { slug: 'toco', name: 'Caminhões toco' },
]

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

export function truckBrandSlug(brand: string) {
  return brand.toLowerCase().replace(/[^a-z0-9]+/gi, '-')
}

export function canonicalTruckBrand(value: string) {
  const normalized = value.trim().toLowerCase()
  return TRUCK_BRANDS.find((brand) => truckBrandSlug(brand) === normalized || brand.toLowerCase() === normalized) || value
}

/* ────────────────────────────────────────────────────────────
   Páginas de aterrissagem de SEO (mesmo modelo de /carros/[slug])
   ──────────────────────────────────────────────────────────── */

export type TruckSeoPreset = {
  slug: string
  title: string
  description: string
  h1: string
  intro: string
  listingQuery: TruckListingFilters
  /** Perguntas específicas do preset, exibidas antes das genéricas do site. */
  faq?: TruckFaq[]
}

export const TRUCK_CATEGORY_PRESETS: TruckSeoPreset[] = [
  {
    slug: 'cavalo-mecanico',
    title: 'Cavalos mecânicos à venda',
    description: 'Cavalos mecânicos usados e seminovos com preço, ano, km e comparação FIPE. Anúncios reais de todo o Brasil.',
    h1: 'Cavalos mecânicos à venda',
    intro: 'Compare cavalos mecânicos anunciados na Carbi por marca, ano, eixos e capacidade de carga.',
    listingQuery: { truckType: 'cavalo-mecanico', sort: 'recent' },
    faq: [
      {
        q: 'Para que serve um cavalo mecânico?',
        a: 'O cavalo mecânico traciona semi-reboques e implementos. Ele não carrega a carga diretamente: o peso fica no reboque, o que permite compor conjuntos longos de alta capacidade.',
      },
      {
        q: 'O que verificar na compra de um cavalo mecânico usado?',
        a: 'Confira a quilometragem, o estado da embreagem e da suspensão, a documentação do chassi e a compatibilidade do acoplamento com o tipo de reboque que você já utiliza.',
      },
    ],
  },
  {
    slug: 'bitruck',
    title: 'Bitrucks à venda',
    description: 'Bitrucks usados e seminovos anunciados na Carbi. Compare preços, ano, km e capacidade de carga.',
    h1: 'Bitrucks à venda',
    intro: 'Bitrucks com dados completos de ano, quilometragem e capacidade de carga.',
    listingQuery: { truckType: 'bitruck', sort: 'recent' },
    faq: [
      {
        q: 'Qual a diferença entre bitruck e truck?',
        a: 'O bitruck distribui a carga em mais eixos e geralmente trabalha com conjunto articulado, enquanto o truck tem a carga sobre o próprio chassi. Na prática, o bitruck aceita peso total maior.',
      },
      {
        q: 'Quanto carrega um bitruck?',
        a: 'A capacidade varia conforme o número de eixos, a carroceria e o PBT declarado. Nos anúncios da Carbi você enxerga a capacidade de carga, os eixos e o PBT lado a lado para comparar.',
      },
    ],
  },
  {
    slug: 'truck',
    title: 'Caminhões truck à venda',
    description: 'Caminhões truck usados e seminovos na Carbi. Preço, ano, eixos e comparação com a tabela FIPE.',
    h1: 'Caminhões truck à venda',
    intro: 'Caminhões truck anunciados com ficha técnica completa e comparação FIPE.',
    listingQuery: { truckType: 'truck', sort: 'recent' },
    faq: [
      {
        q: 'O que é um caminhão truck?',
        a: 'É o caminhão de média e alta capacidade com dois eixos traseiros, indicado para carga de médio a longo percurso. É a categoria mais versátil do transporte rodoviário de cargas.',
      },
      {
        q: 'Caminhão truck é bom para longa distância?',
        a: 'Sim. Cabines com beliche, tanques maiores e boa relação de marchas fazem do truck uma opção comum em rotas longas, sempre respeitando o PBT e a CMT do veículo.',
      },
    ],
  },
  {
    slug: 'toco',
    title: 'Caminhões toco à venda',
    description: 'Caminhões toco usados e seminovos na Carbi, com filtros de preço, ano e capacidade de carga.',
    h1: 'Caminhões toco à venda',
    intro: 'Caminhões toco anunciados na plataforma, prontos para comparar preço e capacidade.',
    listingQuery: { truckType: 'toco', sort: 'recent' },
    faq: [
      {
        q: 'O que é um caminhão toco?',
        a: 'É o caminhão com eixo traseiro simples, mais curto e ágil. É a escolha recorrente para distribuição urbana, entregas de médio volume e rotas com espaço reduzido.',
      },
      {
        q: 'Toco serve para carga pesada?',
        a: 'O toco é indicado para cargas dentro do limite do seu eixo único. Para peso maior, a opção é truck ou bitruck — confira sempre o PBT e a CMT informados no anúncio.',
      },
    ],
  },
  {
    slug: 'diesel',
    title: 'Caminhões a diesel à venda',
    description: 'Caminhões a diesel de todas as categorias anunciados na Carbi. Compare preço, ano e km.',
    h1: 'Caminhões a diesel à venda',
    intro: 'Todos os caminhões a diesel anunciados, com dados reais de preço e quilometragem.',
    listingQuery: { fuel: 'diesel', sort: 'recent' },
    faq: [
      {
        q: 'Por que o diesel domina o transporte de cargas?',
        a: 'O motor a diesel entrega torque em baixa rotação e melhor rendimento quilométrico em carga pesada, o que reduz o custo por viagem em comparação com motores a gasolina.',
      },
    ],
  },
]

export const TRUCK_PRICE_PRESETS: TruckSeoPreset[] = [
  {
    slug: 'ate-100-mil',
    title: 'Caminhões até R$ 100 mil',
    description: 'Anúncios de caminhões até R$ 100 mil com ano, km e comparação FIPE. Oportunidades reais.',
    h1: 'Caminhões até R$ 100 mil',
    intro: 'Caminhões anunciados com teto de R$ 100 mil, ordenados do menor para o maior preço.',
    listingQuery: { priceMax: 100000, sort: 'price_asc' },
  },
  {
    slug: 'ate-150-mil',
    title: 'Caminhões até R$ 150 mil',
    description: 'Caminhões até R$ 150 mil anunciados na Carbi, com dados reais e comparação FIPE.',
    h1: 'Caminhões até R$ 150 mil',
    intro: 'Seleção de caminhões até R$ 150 mil para comparar oportunidade e estado de conservação.',
    listingQuery: { priceMax: 150000, sort: 'price_asc' },
  },
  {
    slug: 'ate-200-mil',
    title: 'Caminhões até R$ 200 mil',
    description: 'Caminhões usados e seminovos até R$ 200 mil. Veja preços, ano, km e a ficha técnica completa.',
    h1: 'Caminhões até R$ 200 mil',
    intro: 'Anúncios ativos de caminhões até R$ 200 mil, com ficha técnica e comparação FIPE.',
    listingQuery: { priceMax: 200000, sort: 'price_asc' },
  },
  {
    slug: 'ate-300-mil',
    title: 'Caminhões até R$ 300 mil',
    description: 'Caminhões até R$ 300 mil anunciados na Carbi, incluindo cavalos mecânicos e bitrucks.',
    h1: 'Caminhões até R$ 300 mil',
    intro: 'Caminhões com valor até R$ 300 mil, incluindo categorias de maior capacidade.',
    listingQuery: { priceMax: 300000, sort: 'price_asc' },
  },
  {
    slug: 'ate-500-mil',
    title: 'Caminhões até R$ 500 mil',
    description: 'Caminhões seminovos e novos até R$ 500 mil anunciados na Carbi com comparação FIPE.',
    h1: 'Caminhões até R$ 500 mil',
    intro: 'Caminhões de maior valor agregado anunciados na plataforma, com ficha completa.',
    listingQuery: { priceMax: 500000, sort: 'price_asc' },
  },
  {
    slug: 'acima-de-300-mil',
    title: 'Caminhões acima de R$ 300 mil',
    description: 'Caminhões acima de R$ 300 mil anunciados na Carbi. Cavalos mecânicos e bitrucks de alto valor.',
    h1: 'Caminhões acima de R$ 300 mil',
    intro: 'Caminhões de alto valor anunciados, para quem precisa de capacidade e tecnologia mais recentes.',
    listingQuery: { priceMin: 300000, sort: 'price_desc' },
  },
  {
    slug: 'ate-80-mil',
    title: 'Caminhões até R$ 80 mil',
    description: 'Caminhões até R$ 80 mil anunciados na Carbi. Entradas de mercado com preço, ano e km.',
    h1: 'Caminhões até R$ 80 mil',
    intro: 'As entradas do mercado de caminhões usados, ordenadas do menor para o maior preço.',
    listingQuery: { priceMax: 80000, sort: 'price_asc' },
  },
  {
    slug: 'ate-120-mil',
    title: 'Caminhões até R$ 120 mil',
    description: 'Caminhões até R$ 120 mil anunciados na Carbi, com ano, quilometragem e comparação FIPE.',
    h1: 'Caminhões até R$ 120 mil',
    intro: 'Seleção de caminhões até R$ 120 mil para comparar capacidade e estado de conservação.',
    listingQuery: { priceMax: 120000, sort: 'price_asc' },
  },
  {
    slug: 'de-150-a-300-mil',
    title: 'Caminhões de R$ 150 mil a R$ 300 mil',
    description: 'Caminhões entre R$ 150 mil e R$ 300 mil anunciados na Carbi, com ficha técnica e FIPE.',
    h1: 'Caminhões de R$ 150 mil a R$ 300 mil',
    intro: 'A faixa de preço mais disputada do mercado de caminhões usados, do menor para o maior valor.',
    listingQuery: { priceMin: 150000, priceMax: 300000, sort: 'price_asc' },
  },
  {
    slug: 'acima-de-500-mil',
    title: 'Caminhões acima de R$ 500 mil',
    description: 'Caminhões acima de R$ 500 mil anunciados na Carbi. Modelos recentes e de alta capacidade.',
    h1: 'Caminhões acima de R$ 500 mil',
    intro: 'Caminhões de alto valor, com foco em ano recente, tecnologia e menor tempo de uso.',
    listingQuery: { priceMin: 500000, sort: 'price_desc' },
  },
]

export const TRUCK_COMBINED_PRESETS: TruckSeoPreset[] = [
  {
    slug: 'cavalo-mecanico-ate-300-mil',
    title: 'Cavalos mecânicos até R$ 300 mil',
    description: 'Cavalos mecânicos até R$ 300 mil anunciados na Carbi. Compare preço, ano, eixos e FIPE.',
    h1: 'Cavalos mecânicos até R$ 300 mil',
    intro: 'Cavalos mecânicos nessa faixa de preço com ficha técnica completa.',
    listingQuery: { truckType: 'cavalo-mecanico', priceMax: 300000, sort: 'price_asc' },
  },
  {
    slug: 'cavalo-mecanico-ate-500-mil',
    title: 'Cavalos mecânicos até R$ 500 mil',
    description: 'Cavalos mecânicos seminovos até R$ 500 mil com comparação FIPE e dados reais.',
    h1: 'Cavalos mecânicos até R$ 500 mil',
    intro: 'Cavalos mecânicos mais recentes e completos anunciados na plataforma.',
    listingQuery: { truckType: 'cavalo-mecanico', priceMax: 500000, sort: 'price_asc' },
  },
  {
    slug: 'bitruck-ate-200-mil',
    title: 'Bitrucks até R$ 200 mil',
    description: 'Bitrucks até R$ 200 mil anunciados na Carbi, com ano, km e capacidade de carga.',
    h1: 'Bitrucks até R$ 200 mil',
    intro: 'Bitrucks nessa faixa de preço para comparar capacidade de carga e estado.',
    listingQuery: { truckType: 'bitruck', priceMax: 200000, sort: 'price_asc' },
  },
  {
    slug: 'truck-ate-150-mil',
    title: 'Caminhões truck até R$ 150 mil',
    description: 'Caminhões truck até R$ 150 mil anunciados na Carbi com dados reais de preço e ano.',
    h1: 'Caminhões truck até R$ 150 mil',
    intro: 'Caminhões truck até R$ 150 mil, ordenados pelo menor preço.',
    listingQuery: { truckType: 'truck', priceMax: 150000, sort: 'price_asc' },
  },
  {
    slug: 'toco-ate-150-mil',
    title: 'Caminhões toco até R$ 150 mil',
    description: 'Caminhões toco até R$ 150 mil anunciados na Carbi. Compare preço, ano e capacidade.',
    h1: 'Caminhões toco até R$ 150 mil',
    intro: 'Caminhões toco até R$ 150 mil anunciados na plataforma.',
    listingQuery: { truckType: 'toco', priceMax: 150000, sort: 'price_asc' },
  },
]

/* ── Carroceria ──
   Filtro em `truck_body_type` (a coluna `body_type` de caminhão é sempre
   "Caminhão", então filtrar por ela devolveria sempre a mesma lista). */
export const TRUCK_BODY_PRESETS: TruckSeoPreset[] = [
  {
    slug: 'caminhoes-bau',
    title: 'Caminhões baú à venda',
    description: 'Caminhões com carroceria baú anunciados na Carbi. Compare preço, ano, km e categoria.',
    h1: 'Caminhões baú à venda',
    intro: 'Caminhões com carroceria baú para transporte de carga seca e volume.',
    listingQuery: { truckBodyType: 'bau', sort: 'recent' },
    faq: [
      {
        q: 'Para que serve um caminhão baú?',
        a: 'O baú protege a carga da chuva e do sol, o que o torna indicado para produtos secos, eletrônicos, bebidas e carga geral que não pode ficar exposta.',
      },
    ],
  },
  {
    slug: 'caminhoes-sider',
    title: 'Caminhões sider à venda',
    description: 'Caminhões sider usados e seminovos anunciados na Carbi, com preço, ano e capacidade de carga.',
    h1: 'Caminhões sider à venda',
    intro: 'Caminhões sider para carga paletizada, com abertura lateral e boa dinâmica de carregamento.',
    listingQuery: { truckBodyType: 'sider', sort: 'recent' },
    faq: [
      {
        q: 'Qual a diferença entre sider e baú?',
        a: 'O sider tem laterais que abrem inteiramente, permitindo entrada de empilhadeira de todos os lados. O baú abre apenas na traseira, o que deixa a carga mais protegida.',
      },
    ],
  },
  {
    slug: 'caminhoes-graneleiro',
    title: 'Caminhões graneleiro à venda',
    description: 'Caminhões graneleiro para grãos e carga solta, anunciados na Carbi com preço e ficha técnica.',
    h1: 'Caminhões graneleiro à venda',
    intro: 'Graneleiros anunciados para transporte de soja, milho, farelos e outras cargas soltas.',
    listingQuery: { truckBodyType: 'graneleiro', sort: 'recent' },
    faq: [
      {
        q: 'O que é um caminhão graneleiro?',
        a: 'É o caminhão com carroceria de tipo graneleiro, feita para carga solta como grãos. A estrutura permite esvaziamento rápido e trabalha bem com carga de baixa densidade.',
      },
    ],
  },
  {
    slug: 'caminhoes-tanque',
    title: 'Caminhões tanque à venda',
    description: 'Caminhões tanque para líquidos e combustíveis, anunciados na Carbi com dados reais.',
    h1: 'Caminhões tanque à venda',
    intro: 'Caminhões tanque para transporte de líquidos, com documentação e ficha técnica completas.',
    listingQuery: { truckBodyType: 'tanque', sort: 'recent' },
    faq: [
      {
        q: 'O que avaliar em um caminhão tanque usado?',
        a: 'Além da mecânica, verifique o histórico de impermeabilização do tanque, a limpeza da tubulação e a documentação específica para o tipo de líquido transportado.',
      },
    ],
  },
  {
    slug: 'caminhoes-basculante',
    title: 'Caminhões basculantes à venda',
    description: 'Caminhões basculantes para terra, brita e mineração, anunciados na Carbi com preço e ano.',
    h1: 'Caminhões basculantes à venda',
    intro: 'Basculantes para obras e mineração, com capacidade de carga e estado de conservação à vista.',
    listingQuery: { truckBodyType: 'basculante', sort: 'recent' },
    faq: [
      {
        q: 'Para que serve um caminhão basculante?',
        a: 'O basculante descarrega sozinho inclinando a carroceria. É comum em obras, extração e movimentação de terra, onde a descarga rápida pesa mais que a proteção da carga.',
      },
    ],
  },
  {
    slug: 'caminhoes-boiadeira',
    title: 'Caminhões boiadeira à venda',
    description: 'Caminhões boiadeira para transporte de gado, anunciados na Carbi com preço e ficha técnica.',
    h1: 'Caminhões boiadeira à venda',
    intro: 'Boiadeiras anunciadas para transporte de animais, com estrutura de grades e boas condições de uso.',
    listingQuery: { truckBodyType: 'boiadeira', sort: 'recent' },
    faq: [
      {
        q: 'O que diferencia uma boiadeira de outras carrocerias?',
        a: 'A boiadeira tem grades altas e piso reforçado para transporte de animais, geralmente com dois pavimentos. O estado das grades e do piso é o ponto principal de inspeção.',
      },
    ],
  },
  {
    slug: 'caminhoes-plataforma',
    title: 'Caminhões plataforma à venda',
    description: 'Caminhões plataforma e de baú aberto, anunciados na Carbi com preço, ano e km.',
    h1: 'Caminhões plataforma à venda',
    intro: 'Caminhões plataforma para cargas de dimensões variadas e carregamento pelos quatro lados.',
    listingQuery: { truckBodyType: 'plataforma', sort: 'recent' },
  },
  {
    slug: 'caminhoes-carga-seca',
    title: 'Caminhões de carga seca à venda',
    description: 'Caminhões de carga seca anunciados na Carbi, com preço, ano, km e capacidade de carga.',
    h1: 'Caminhões de carga seca à venda',
    intro: 'Carga seca para produtos que não exigem controle de temperatura nem vedação especial.',
    listingQuery: { truckBodyType: 'carga-seca', sort: 'recent' },
  },
]

export const TRUCK_TOPIC_PRESETS: TruckSeoPreset[] = [
  {
    slug: 'mais-baratos',
    title: 'Caminhões mais baratos à venda',
    description: 'Os caminhões com menor preço anunciados na Carbi, em ordem crescente.',
    h1: 'Caminhões mais baratos',
    intro: 'Ordenação por menor preço para encontrar rapidamente as entradas do mercado.',
    listingQuery: { sort: 'price_asc' },
  },
  {
    slug: 'mais-recentes',
    title: 'Caminhões recém-anunciados',
    description: 'Acompanhe os caminhões anunciados mais recentemente na Carbi.',
    h1: 'Caminhões recém-anunciados',
    intro: 'Atualização frequente de anúncios de caminhões na plataforma.',
    listingQuery: { sort: 'recent' },
  },
  {
    slug: 'anunciar-gratis',
    title: 'Anunciar caminhão grátis',
    description: 'Publique seu caminhão grátis na Carbi, com ficha técnica, fotos e chat interno.',
    h1: 'Anunciar caminhão grátis',
    intro: 'Publique seu caminhão sem custo e alcance compradores de todo o Brasil.',
    listingQuery: { sort: 'recent' },
    faq: [
      {
        q: 'Anunciar caminhão na Carbi tem alguma taxa?',
        a: 'Não. O anúncio é gratuito: você preenche a ficha técnica, adiciona fotos e publica. A negociação acontece pelo chat interno da plataforma.',
      },
      {
        q: 'Preciso ter conta para anunciar meu caminhão?',
        a: 'A conta é criada no último passo do anúncio, com e-mail e senha. Você preenche os dados do caminhão primeiro e só se cadastra na hora de publicar.',
      },
    ],
  },
  {
    slug: 'seminovos',
    title: 'Caminhões seminovos à venda',
    description: 'Caminhões seminovos anunciados na Carbi, com preço, ano, quilometragem e comparação FIPE.',
    h1: 'Caminhões seminovos à venda',
    intro: 'Seminovos com ficha técnica completa, para comparar preço e quilometragem antes de fechar negócio.',
    listingQuery: { sort: 'recent' },
    faq: [
      {
        q: 'O que considerar na compra de um caminhão seminovo?',
        a: 'Além do preço, olhe a quilometragem por ano de uso, o histórico de manutenção, o estado de pneus e freios e a compatibilidade da carroceria com a sua carga.',
      },
    ],
  },
]

export const TRUCK_SEO_PRESETS: TruckSeoPreset[] = [
  ...TRUCK_TOPIC_PRESETS,
  ...TRUCK_PRICE_PRESETS,
  ...TRUCK_CATEGORY_PRESETS,
  ...TRUCK_COMBINED_PRESETS,
  ...TRUCK_BODY_PRESETS,
]

export const TRUCK_SEO_SLUGS = TRUCK_SEO_PRESETS.map((preset) => preset.slug)

export const TRUCK_QUICK_LINKS: Array<{ href: string; label: string }> = [
  { href: '/caminhoes/cavalo-mecanico', label: 'Cavalos mecânicos' },
  { href: '/caminhoes/bitruck', label: 'Bitrucks' },
  { href: '/caminhoes/truck', label: 'Caminhões truck' },
  { href: '/caminhoes/toco', label: 'Toco' },
  { href: '/caminhoes/ate-150-mil', label: 'Até R$ 150 mil' },
  { href: '/caminhoes/ate-300-mil', label: 'Até R$ 300 mil' },
  { href: '/caminhoes/acima-de-300-mil', label: 'Acima de R$ 300 mil' },
  { href: '/caminhoes/mais-baratos', label: 'Mais baratos' },
  { href: '/caminhoes/mais-recentes', label: 'Mais recentes' },
  { href: '/caminhoes/diesel', label: 'A diesel' },
]

const TRUCK_YEAR_RANGE = Array.from({ length: 17 }, (_, index) => String(2010 + index))

export const TRUCK_YEAR_SLUGS = TRUCK_YEAR_RANGE.map((year) => `ano-${year}`)

/** Aceita os presets fixos e também marca-, cidade- e ano- (como em /carros/[slug]). */
export function resolveTruckPreset(slug: string): TruckSeoPreset | null {
  const normalized = decodeURIComponent(slug || '').trim().toLowerCase()
  const direct = TRUCK_SEO_PRESETS.find((preset) => preset.slug === normalized)
  if (direct) return direct

  if (normalized.startsWith('marca-')) {
    const brandSlug = normalized.replace('marca-', '')
    const brand = canonicalTruckBrand(brandSlug.replace(/-/g, ' '))
    const label = brand.replace(/\b\w/g, (match) => match.toUpperCase())
    return {
      slug: normalized,
      title: `Caminhões ${label} à venda`,
      description: `Caminhões ${label} usados e seminovos anunciados na Carbi, com preço, ano, km e comparação FIPE.`,
      h1: `Caminhões ${label} à venda`,
      intro: `Anúncios de caminhões ${label} para comparar preço, ano e categoria.`,
      listingQuery: { brand: `%${label}%`, sort: 'recent' },
      faq: [
        {
          q: `Caminhões ${label} usados: o que observar?`,
          a: `Compare preço, ano e quilometragem entre os anúncios ativos de ${label} e use a comparação com a tabela FIPE para avaliar se o valor pedido está coerente com o mercado.`,
        },
        {
          q: `Quais categorias de ${label} aparecem na Carbi?`,
          a: `Os anúncios de ${label} podem ser filtrados por truck, toco, bitruck e cavalo mecânico, além de carroceria, número de eixos e capacidade de carga.`,
        },
      ],
    }
  }

  if (normalized.startsWith('cidade-')) {
    const citySlug = normalized.replace('cidade-', '')
    const cityName = citySlug.replace(/-/g, ' ')
    const known = MAJOR_CITIES.find((city) => city.slug === citySlug)
    // Exibição usa o nome oficial; o filtro continua no formato ASCII, que é
    // como a coluna `city` é preenchida na prática.
    const label = known?.name || cityName.replace(/\b\w/g, (match) => match.toUpperCase())
    const queryLabel = cityName.replace(/\b\w/g, (match) => match.toUpperCase())
    return {
      slug: normalized,
      title: `Caminhões em ${label}`,
      description: `Caminhões à venda em ${label} com atualização constante de preço e disponibilidade.`,
      h1: `Caminhões em ${label}`,
      intro: `Anúncios ativos de caminhões na cidade de ${label}.`,
      listingQuery: { city: `%${queryLabel}%`, sort: 'recent' },
      faq: [
        {
          q: `Comprar caminhão em ${label}: vale a pena ver anúncios locais?`,
          a: `Sim. Comprar na região reduz custo de deslocamento para ver o veículo e facilita a vistoria, a transferência e o acompanhamento pós-venda.`,
        },
      ],
    }
  }

  if (normalized.startsWith('ano-')) {
    const year = normalized.replace('ano-', '')
    if (/^\d{4}$/.test(year)) {
      return {
        slug: normalized,
        title: `Caminhões ${year} à venda`,
        description: `Caminhões do ano ${year} anunciados na Carbi. Compare preço, km e categoria.`,
        h1: `Caminhões ${year} à venda`,
        intro: `Anúncios de caminhões do ano ${year} publicados na plataforma.`,
        listingQuery: { yearMin: Number(year), yearMax: Number(year), sort: 'recent' },
        faq: [
          {
            q: `O que checar em um caminhão do ano ${year}?`,
            a: `Confira a quilometragem média anual, o histórico de manutenção e a documentação. Quanto mais antigo o modelo, maior a atenção ao estado de suspensão, freios e embreagem.`,
          },
        ],
      }
    }
  }

  return null
}

/** FAQ da página: as perguntas específicas do preset + as genéricas do site. */
export function truckPresetFaq(preset: TruckSeoPreset): TruckFaq[] {
  return [...(preset.faq || []), ...TRUCK_FAQ]
}

export function getAllTruckSeoParams(): Array<{ slug: string }> {
  const slugs = [
    ...TRUCK_SEO_SLUGS,
    ...TRUCK_BRANDS.map((brand) => `marca-${truckBrandSlug(brand)}`),
    ...MAJOR_CITIES.map((city) => `cidade-${city.slug}`),
    ...TRUCK_YEAR_SLUGS,
  ]
  return slugs.map((slug) => ({ slug }))
}

const TRUCK_OG_IMAGE = { url: '/images/caminhao-hero.jpg', width: 736, height: 417, alt: 'Caminhão em rodovia' }

export function truckPresetMetadata(preset: TruckSeoPreset, hasParameters = false): Metadata {
  const canonicalUrl = `${SITE_URL}/caminhoes/${preset.slug}`
  return {
    title: preset.title,
    description: preset.description,
    keywords: ['caminhões à venda', 'caminhão usado', preset.h1.toLowerCase()],
    alternates: { canonical: canonicalUrl },
    // Filtros aplicados na URL não devem competir com a página limpa no índice
    robots: hasParameters ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: preset.title,
      description: preset.description,
      url: canonicalUrl,
      type: 'website',
      images: [TRUCK_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: preset.title,
      description: preset.description,
      images: [TRUCK_OG_IMAGE.url],
    },
  }
}

export function truckListingMetadata(path = '/caminhoes'): Metadata {
  return {
    title: 'Caminhões à venda',
    description: 'Encontre caminhões usados e seminovos à venda, compare preços e negocie com segurança na Carbi.',
    keywords: ['caminhões à venda', 'caminhão usado', 'caminhão seminovo', 'comprar caminhão'],
    alternates: { canonical: path },
    openGraph: {
      title: 'Caminhões à venda',
      description: 'Caminhões usados e seminovos com negociação segura.',
      url: path,
      type: 'website',
      images: [TRUCK_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Caminhões à venda',
      description: 'Caminhões usados e seminovos com negociação segura.',
      images: [TRUCK_OG_IMAGE.url],
    },
  }
}

type TruckCollectionListing = { slug: string; brand: string; model: string; price?: number | null }

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function truckCollectionJsonLd({ url, name, listings }: { url: string; name: string; listings: TruckCollectionListing[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: listings.map((listing, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `/caminhoes/anuncio/${listing.slug}`,
        name: `${listing.brand} ${listing.model}`,
        item: { '@type': 'Product', name: `${listing.brand} ${listing.model}`, offers: listing.price ? { '@type': 'Offer', price: listing.price, priceCurrency: 'BRL' } : undefined },
      })),
    },
  }
}

export function truckBrowseJsonLd({ name, description, url, items }: { name: string; description: string; url: string; items: Array<{ name: string; url: string }> }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  }
}

export type TruckFaq = { q: string; a: string }

export function truckFaqJsonLd(faqs: TruckFaq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }
}

export const TRUCK_FAQ: TruckFaq[] = [
  {
    q: 'Como comparar o preço de um caminhão usado?',
    a: 'Cada anúncio na Carbi mostra o preço pedido, o ano, a quilometragem e a comparação com a tabela FIPE. Use esses dados para avaliar se o valor está justo antes de negociar.',
  },
  {
    q: 'O que significam truck, bitruck, cavalo mecânico e toco?',
    a: 'São categorias de caminhão. O toco tem um eixo traseiro simples, o truck tem dois eixos traseiros, o bitruck combina eixos com maior capacidade de carga e o cavalo mecânico é feito para tracionar semirreboques.',
  },
  {
    q: 'Posso anunciar meu caminhão gratuitamente?',
    a: 'Sim. O anúncio de caminhão é gratuito, com ficha técnica, fotos e chat interno para negociar sem expor seu telefone.',
  },
  {
    q: 'A consulta pela placa funciona para caminhões?',
    a: 'Sim. A busca por placa retorna marca, modelo, ano e versão do caminhão para preencher o anúncio em poucos passos.',
  },
]

export type TruckSeoInput = ListingsPageInput
