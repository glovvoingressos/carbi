import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SEOPageClient from '@/components/seo/SEOPageClient'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'
import { getAllCars } from '@/lib/data-fetcher'
import { slugifyBrand } from '@/lib/brand-utils'
import { BreadcrumbSchema, FAQSchema } from '@/components/seo/JSONLD'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

// Marcas que precisam de caixa alta
const upperCaseBrands = new Set(['ram', 'bmw', 'byd', 'gwm', 'gac'])

// Orientação específica para veículos BYD; demais marcas usam apenas instruções
// genéricas de preenchimento sem alegações sobre garantia, rede ou desempenho.
const chineseBrandInfo: Record<string, { description: string; highlights: string[] }> = {
  byd: {
    description: 'Prepare seu anúncio de BYD com informações verificáveis sobre versão, sistema elétrico, estado da bateria e histórico documental do veículo.',
    highlights: ['Informe a versão e o ano-modelo exatos', 'Anexe laudo da bateria se tiver', 'Descreva a garantia conforme os documentos', 'Inclua revisões e histórico de reparos'],
  },
}

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
  const knownBrands = await getAllCars()
  if (!knownBrands.some((car) => slugifyBrand(car.brand) === brand.toLowerCase())) {
    return { title: 'Marca não encontrada', robots: { index: false, follow: true } }
  }
  const capitalizedBrand = titleCase(brand)
  const canonicalUrl = `${SITE_URL}/vender/${brand}`

  const isByd = brand.toLowerCase() === 'byd'
  const title = isByd ? 'Anunciar BYD na Carbi | Prepare seu anúncio' : `Anunciar ${capitalizedBrand} na Carbi`
  const description = isByd
    ? 'Anuncie seu BYD na Carbi. Informe a versão, o estado da bateria quando houver laudo, a garantia conforme os documentos e o histórico de revisões.'
    : `Crie um anúncio de ${capitalizedBrand} na Carbi, com fotos, dados do veículo e contato pelo chat interno.`

  return {
    title,
    description,
    keywords: [
      `vender ${capitalizedBrand}`,
      `anunciar ${capitalizedBrand}`,
      'vender carro',
      'anunciar carro grátis',
      'seminovos à venda',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
    },
  }
}

export default async function VenderBrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params
  const knownBrands = await getAllCars()
  if (!knownBrands.some((car) => slugifyBrand(car.brand) === brand.toLowerCase())) notFound()
  const capitalizedBrand = titleCase(brand)
  const brandLower = brand.toLowerCase()
  const { total } = await fetchPublicListingsPage({ brand: `%${capitalizedBrand}%`, vehicle_type: 'car', page: 1, pageSize: 24, sort: 'recent' })

  const brandInfo = chineseBrandInfo[brandLower]

  const isByd = brandLower === 'byd'
  const brandDescription = brandInfo?.description || `Prepare o anúncio do seu ${capitalizedBrand} com versão, ano-modelo, quilometragem, fotos e histórico disponíveis.`
  const brandHighlights = brandInfo?.highlights || ['Informe a versão exata', 'Use fotos atuais', 'Registre quilometragem e estado', 'Anexe documentos pertinentes']

  const data = {
    h1: isByd ? 'Anunciar BYD' : `Anunciar ${capitalizedBrand}`,
    subtitle: brandDescription,
    ctaButtonText: `Anunciar meu ${capitalizedBrand}`,
    benefits: [
      { icon: 'BadgeDollarSign', title: 'Preço com contexto', description: `Compare o valor pedido com anúncios da plataforma e use FIPE somente quando a combinação exata estiver disponível.` },
      { icon: 'Car', title: total ? `${total} ${total === 1 ? 'anúncio' : 'anúncios'} de ${capitalizedBrand}` : `Anúncio de ${capitalizedBrand}`, description: total ? 'Consulte os anúncios publicados e compare versão, ano e estado antes de definir o preço.' : 'Não há anúncios públicos desta marca para usar como comparação no momento.' },
      { icon: 'ShieldCheck', title: 'Informações claras', description: 'Descreva o veículo com dados e documentos que possam ser conferidos pelo interessado.' },
    ],
    sections: [
      {
        badge: isByd ? 'Preparação do anúncio' : 'Sobre o anúncio',
        title: isByd ? 'O que informar ao anunciar um BYD' : `Como preparar o anúncio do seu ${capitalizedBrand}`,
        subtitle: brandDescription,
        content: isByd
          ? `Identifique a versão e o ano-modelo sem abreviações ambíguas. Para veículos com bateria de tração, informe autonomia e histórico de recarga apenas quando souber; se houver laudo de saúde da bateria, indique a data e anexe o documento. Registre revisões, reparos e eventuais sinistros com comprovantes, quando disponíveis. Sobre garantia, copie prazo, cobertura e validade dos documentos oficiais do veículo; não estime esses dados.`
          : `Antes de publicar, confira os dados da versão, ano-modelo, quilometragem e estado do veículo. Use fotos atuais e inclua comprovantes de revisões e reparos quando disponíveis.`,
      },
      {
        badge: 'Mercado atual',
        title: `Como definir o preço do seu ${capitalizedBrand}`,
        subtitle: `Use referências compatíveis com a versão, o ano-modelo e o estado do veículo.`,
        content: total > 0
          ? `Há ${total} anúncio(s) público(s) de ${capitalizedBrand} na plataforma. Compare veículos com versão, ano-modelo, quilometragem e condição semelhantes. A FIPE só deve ser usada quando a combinação exata estiver disponível; ela é referência, não garantia do preço de venda.`
          : `No momento, não há anúncios públicos de ${capitalizedBrand} para comparação na plataforma. Consulte a FIPE apenas quando houver correspondência exata de versão e ano-modelo e deixe claro que ela é uma referência, não garantia do preço de venda.`,
      },
      {
        badge: 'Guia de venda',
        title: `Como publicar seu ${capitalizedBrand} na Carbi`,
        subtitle: 'Revise as informações e mantenha o anúncio alinhado ao estado atual do veículo.',
        content: `Preencha versão, ano-modelo, quilometragem e preço pedido. Inclua fotos atuais e responda às perguntas pelo chat interno. ${isByd ? 'Para um BYD, acrescente documentos de bateria e garantia somente se estiverem disponíveis e puderem ser conferidos.' : ''}`,
      },
    ],
    faqs: isByd
      ? [
          { q: 'Devo informar a saúde da bateria do BYD?', a: 'Informe um percentual ou avaliação somente se tiver laudo ou diagnóstico identificável. Se não tiver, não estime; descreva apenas o que pode confirmar.' },
          { q: 'Como declarar a garantia do BYD?', a: 'Confira os documentos oficiais e informe prazo, cobertura e validade exatamente como aparecem neles. As condições podem variar por modelo, componente e histórico.' },
          { q: 'O que incluir no histórico do veículo?', a: 'Informe revisões, reparos, sinistros conhecidos e intervenções na bateria, se houver. Anexe notas, laudos ou registros que sustentem as informações.' },
        ]
      : [
          { q: `O que informar ao anunciar um ${capitalizedBrand}?`, a: 'Informe versão, ano-modelo, quilometragem, estado e preço pedido. Use fotos atuais e inclua documentos relevantes quando disponíveis.' },
          { q: `Como comparar o preço do meu ${capitalizedBrand}?`, a: 'Compare anúncios de versão, ano e condição semelhantes. Use a FIPE apenas se encontrar a combinação exata e informe a referência consultada.' },
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
