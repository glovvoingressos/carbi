import type { Metadata } from 'next'
import Link from 'next/link'
import BrandLogo from '@/components/brand/BrandLogo'
import { normalizeBrandKey, pickPreferredBrandName, slugifyBrand } from '@/lib/brand-utils'
import { BreadcrumbSchema } from '@/components/seo/JSONLD'
import { fetchPublicListingsPage } from '@/lib/marketplace-server'

export const metadata: Metadata = {
  title: 'Marcas de carros à venda | Carbi',
  description: 'Veja marcas de carros com anúncios reais, dados técnicos e opções seminovas à venda em uma vitrine organizada.',
  keywords: ['marcas de carros', 'carros à venda', 'seminovos à venda', 'carros usados', 'comprar carro'],
  alternates: {
    canonical: '/marcas',
  },
  openGraph: {
    title: 'Marcas de carros à venda | Carbi',
    description: 'Veja marcas de carros com anúncios reais, dados técnicos e opções seminovas à venda em uma vitrine organizada.',
    type: 'website',
    url: '/marcas',
  },
}

export default async function MarcasPage() {
  const { items } = await fetchPublicListingsPage({ page: 1, pageSize: 200, sort: 'recent' })
  const brands = Array.from(
    items.reduce((acc, listing) => {
      const key = normalizeBrandKey(listing.brand)
      const current = acc.get(key)
      if (current) {
        current.count += 1
        current.label = pickPreferredBrandName(current.label, listing.brand)
        return acc
      }
      acc.set(key, { key, label: listing.brand, count: 1 })
      return acc
    }, new Map<string, { key: string; label: string; count: number }>())
      .values(),
  ).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))

  return (
    <div className="fingen-shell">
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Marcas', url: '/marcas' },
      ]} />
      <div className="fingen-shell-content">
        <div className="fingen-shell-hero" style={{ textAlign: 'center' }}>
          <div className="fingen-breadcrumb" style={{ justifyContent: 'center' }}>
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Marcas</span>
          </div>
          <h1 className="text-balance">Marcas de carros</h1>
          <p style={{ maxWidth: '500px', margin: '0 auto' }}>
            Explore nosso catálogo com valor atualizado e dados detalhados para cada montadora.
          </p>
        </div>

        <div className="fingen-grid-4">
          {brands.map((brand, i) => {
            const slug = slugifyBrand(brand.label)

            // Basic domain mapping for Clearbit Logo API
            const getDomain = (b: string) => {
              const normalized = normalizeBrandKey(b)
              const map: Record<string, string> = {
                'bmw': 'bmw.com',
                'toyota': 'toyota.com',
                'honda': 'honda.com',
                'fiat': 'fiat.com.br',
                'chevrolet': 'chevrolet.com',
                'volkswagen': 'vw.com',
                'vw': 'vw.com',
                'peugeot': 'peugeot.com',
                'renault': 'renault.com.br',
                'nissan': 'nissan.com',
                'hyundai': 'hyundai.com',
                'caoa chery': 'caoachery.com.br',
                'jeep': 'jeep.com',
                'ford': 'ford.com',
                'audi': 'audi.com',
                'porsche': 'porsche.com',
                'mini': 'mini.com',
                'byd': 'byd.com',
                'gwm': 'gwmbrasil.com.br',
                'ram': 'ram.com',
                'citroen': 'citroen.com',
              }
              return map[normalized] || `${normalized.replace(/\s+/g, '')}.com`
            }

            return (
              <Link
                key={brand.key}
                href={`/marcas/${slug}`}
                className="fingen-card-white group"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 20px', textAlign: 'center', textDecoration: 'none', transition: 'all 0.25s ease' }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    background: 'var(--color-bg-muted)',
                    padding: '8px',
                  }}
                >
                  <BrandLogo
                    brandName={brand.label}
                    domain={getDomain(brand.label)}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{brand.label}</p>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', background: 'var(--color-bg-muted)', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>
                  {brand.count} modelo{brand.count !== 1 ? 's' : ''}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
