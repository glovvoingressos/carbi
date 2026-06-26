import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { BreadcrumbSchema } from '@/components/seo/JSONLD'
import ListingCard from '@/components/marketplace/ListingCard'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'
import { normalizeBrandKey, pickPreferredBrandName, slugifyBrand } from '@/lib/brand-utils'
import { getAllCars } from '@/lib/data-fetcher'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

export async function generateStaticParams() {
  try {
    const cars = await getAllCars()
    const uniqueBrands = Array.from(new Set(cars.map((car) => slugifyBrand(car.brand)))).filter(Boolean)
    return uniqueBrands.map((brand) => ({ brand }))
  } catch (error) {
    console.error('Erro ao gerar static params para marcas:', error)
    return []
  }
}

export const dynamicParams = true

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const resolved = await params
  const brandName = resolved.brand.replace(/-/g, ' ')
  const titleBrand = brandName.replace(/\b\w/g, (match) => match.toUpperCase())
  const canonicalUrl = `${SITE_URL}/marcas/${resolved.brand}`

  return {
    title: `Carros ${titleBrand} à venda | Carbi`,
    description: `Veja carros ${titleBrand} à venda com anúncios reais, fotos quadradas, comparação FIPE e negociação via chat interno.`,
    keywords: [`carros ${titleBrand}`, `${titleBrand} à venda`, 'carros à venda', 'seminovos à venda'],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Carros ${titleBrand} à venda | Carbi`,
      description: `Veja carros ${titleBrand} à venda com anúncios reais, fotos quadradas, comparação FIPE e negociação via chat interno.`,
      type: 'website',
      url: canonicalUrl,
    },
  }
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const resolved = await params
  const brandSlug = resolved.brand
  const normalizedBrand = normalizeBrandKey(brandSlug.replace(/-/g, ' '))
  const { items } = await fetchPublicListingsPage({
    brand: `%${brandSlug.replace(/-/g, ' ')}%`,
    page: 1,
    pageSize: 48,
    sort: 'recent',
  })

  const brandListings = items.filter((listing) => normalizeBrandKey(listing.brand) === normalizedBrand)
  const realBrandName = brandListings.reduce(
    (name, listing) => pickPreferredBrandName(name, listing.brand),
    brandListings[0]?.brand || brandSlug.replace(/-/g, ' '),
  )

  if (brandListings.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-[#0A0A0A] mb-2">Marca não encontrada</h1>
        <p className="text-sm text-[#525252] mb-6">Não foi possível encontrar anúncios ativos para a marca solicitada.</p>
        <Link href="/marcas" className="text-sm text-[#17170F] hover:underline font-medium">&larr; Ver todas as marcas</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Marcas', url: '/marcas' },
        { name: realBrandName, url: `/marcas/${brandSlug}` },
      ]} />
      <nav className="flex items-center gap-1 text-sm text-[#A3A3A3] mb-6 overflow-x-auto no-scrollbar">
        <Link href="/" className="hover:text-[#0A0A0A] transition-colors shrink-0">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/marcas" className="hover:text-[#0A0A0A] transition-colors shrink-0">Marcas</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#0A0A0A] font-medium">{realBrandName}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0A0A0A] mb-2">{realBrandName}</h1>
        <p className="text-sm text-[#525252]">
          {brandListings.length} anúncio{brandListings.length !== 1 ? 's' : ''} ativo{brandListings.length !== 1 ? 's' : ''} desta marca
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {brandListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      <div className="mt-10 rounded-[28px] border border-[#EAEAE8] bg-white p-6">
        <p className="text-sm leading-relaxed text-[#52607A]">
          Esses resultados vêm diretamente dos anúncios ativos da plataforma. Se quiser uma lista mais ampla, use a busca ou a página geral de carros à venda.
        </p>
      </div>
    </div>
  )
}
