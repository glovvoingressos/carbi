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
      <div className="fingen-shell">
        <div className="fingen-shell-content" style={{ textAlign: 'center', paddingTop: '80px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Marca não encontrada</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Não foi possível encontrar anúncios ativos para a marca solicitada.</p>
          <Link href="/marcas" style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 600, textDecoration: 'underline' }}>&larr; Ver todas as marcas</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fingen-shell">
      <div className="fingen-shell-content">
        <BreadcrumbSchema items={[
          { name: 'Home', url: '/' },
          { name: 'Marcas', url: '/marcas' },
          { name: realBrandName, url: `/marcas/${brandSlug}` },
        ]} />
        <div className="fingen-breadcrumb" style={{ paddingTop: '24px' }}>
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/marcas">Marcas</Link>
          <span>/</span>
          <span>{realBrandName}</span>
        </div>

        <div className="fingen-shell-hero">
          <h1 className="text-balance">{realBrandName}</h1>
          <p>
            {brandListings.length} anúncio{brandListings.length !== 1 ? 's' : ''} ativo{brandListings.length !== 1 ? 's' : ''} desta marca
          </p>
        </div>

        <div className="fingen-grid-3">
          {brandListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        <div className="fingen-card-white" style={{ marginTop: '32px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Esses resultados vêm diretamente dos anúncios ativos da plataforma. Se quiser uma lista mais ampla, use a busca ou a página geral de carros à venda.
          </p>
        </div>
      </div>
    </div>
  )
}
