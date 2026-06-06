import { Metadata } from 'next'
import SEOPageClient from '@/components/seo/SEOPageClient'
import { BadgeDollarSign, Car, ShieldCheck } from 'lucide-react'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'

function titleCase(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand } = await params
  const capitalizedBrand = titleCase(brand)

  return {
    title: `Vender ${capitalizedBrand}: Anuncie seu ${capitalizedBrand} rápido na Carbi`,
    description: `Quer vender seu ${capitalizedBrand}? Na Carbi você anuncia seu ${capitalizedBrand} usado ou seminovo com segurança e alcança compradores reais.`,
    keywords: [`vender ${capitalizedBrand}`, `anunciar ${capitalizedBrand}`, 'vender carro', 'anunciar carro grátis', 'seminovos à venda'],
    alternates: {
      canonical: `/vender/${brand}`,
    },
    openGraph: {
      title: `Vender ${capitalizedBrand}: Anuncie seu ${capitalizedBrand} rápido na Carbi`,
      description: `Quer vender seu ${capitalizedBrand}? Na Carbi você anuncia seu ${capitalizedBrand} usado ou seminovo com segurança e alcança compradores reais.`,
      type: 'website',
      url: `/vender/${brand}`,
    },
  }
}

export default async function VenderBrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params
  const capitalizedBrand = titleCase(brand)
  const { items } = await fetchPublicListingsPage({ brand: `%${capitalizedBrand}%`, page: 1, pageSize: 24, sort: 'recent' })

  const data = {
    h1: `Vender ${capitalizedBrand} Rápido e Seguro`,
    subtitle: `Anuncie seu ${capitalizedBrand} na plataforma e venda sem intermediários para compradores reais.`,
    ctaButtonText: `Anunciar meu ${capitalizedBrand}`,
    benefits: [
      { icon: 'BadgeDollarSign', title: 'Valorização real', description: `Compare seu ${capitalizedBrand} com anúncios ativos e a FIPE para precificar melhor.` },
      { icon: 'Car', title: `Anúncios da marca`, description: `Veja demanda real por ${capitalizedBrand} na plataforma antes de publicar.` },
      { icon: 'ShieldCheck', title: 'Venda direta', description: 'Conectamos você a compradores reais, com chat interno e sem expor contato.' },
    ],
    sections: [
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
    ],
  }

  return <SEOPageClient data={data} ctaHref="/anunciar-carro" />
}
