import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SEOPageClient from '@/components/seo/SEOPageClient'
import { Zap, ShieldCheck, BadgeDollarSign, Car, Search, MessageSquare } from 'lucide-react'

// Popular brands for pre-generation or matching
const POPULAR_BRANDS = ['toyota', 'honda', 'volkswagen', 'fiat', 'chevrolet', 'ford', 'hyundai', 'jeep', 'renault', 'nissan']

export async function generateStaticParams() {
  return POPULAR_BRANDS.map((brand) => ({
    brand: brand,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand } = await params
  const capitalizedBrand = brand.charAt(0).toUpperCase() + brand.slice(1)
  
  return {
    title: `Vender ${capitalizedBrand}: Anuncie seu ${capitalizedBrand} rápido na Carbi`,
    description: `Quer vender seu ${capitalizedBrand}? Na Carbi você anuncia seu ${capitalizedBrand} usado ou seminovo com segurança e alcança milhares de compradores.`,
  }
}

export default async function VenderBrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params
  const capitalizedBrand = brand.charAt(0).toUpperCase() + brand.slice(1)

  const data = {
    h1: `Vender ${capitalizedBrand} Rápido e Seguro`,
    subtitle: `Anuncie seu ${capitalizedBrand} na plataforma inteligente e venda sem intermediários para compradores de todo o Brasil.`,
    ctaButtonText: `Anunciar meu ${capitalizedBrand}`,
    benefits: [
      { icon: 'BadgeDollarSign', title: 'Valorização Real', description: `Saiba exatamente quanto vale seu ${capitalizedBrand} com nossa base da Tabela FIPE atualizada.` },
      { icon: 'Car', title: `Especialista em ${capitalizedBrand}`, description: `Nossa plataforma destaca os diferenciais tecnológicos e de mecânica do seu ${capitalizedBrand}.` },
      { icon: 'ShieldCheck', title: 'Venda Direta', description: 'Conectamos você a compradores reais, sem lojistas que depreciam seu veículo.' }
    ],
    sections: [
      {
        badge: 'Guia de Venda',
        title: `Como vender seu ${capitalizedBrand} pelo melhor preço`,
        subtitle: `O mercado de ${capitalizedBrand} seminovos é extremamente valorizado.`,
        content: `Para garantir o melhor valor no seu ${capitalizedBrand}, mantenha o histórico de revisões atualizado e destaque isso no seu anúncio na Carbi. Veículos desta marca são conhecidos pela durabilidade, e compradores buscam essa segurança.`
      },
      {
        badge: 'Mercado Nacional',
        title: `Procura por ${capitalizedBrand} no Brasil`,
        subtitle: `Existe uma alta demanda nacional por modelos ${capitalizedBrand}.`,
        content: `Veículos da marca ${capitalizedBrand} são extremamente buscados em nosso marketplace. Ao anunciar conosco, seu carro ganha visibilidade estruturada para compradores que valorizam a procedência e o estado de conservação.`
      }
    ],
    faqs: [
      { q: `É fácil vender um ${capitalizedBrand} usado?`, a: `Sim, a liquidez de um ${capitalizedBrand} é uma das mais altas do mercado, especialmente se estiver bem conservado e anunciado em uma plataforma com foco em qualidade como a Carbi.` },
      { q: `Como avaliar meu ${capitalizedBrand}?`, a: 'Basta entrar no nosso fluxo de anúncio. Nós puxamos automaticamente o valor da Tabela FIPE para o seu modelo e ano específico.' },
      { q: 'Quanto tempo demora para vender?', a: `Em média, um ${capitalizedBrand} anunciado com preço justo na Carbi é vendido em menos de 15 dias.` }
    ]
  }

  return <SEOPageClient data={data} ctaHref="/anunciar-carro" />
}
