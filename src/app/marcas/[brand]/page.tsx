import Link from 'next/link'
import { getAllCars, groupCarsByModel } from '@/lib/data-fetcher'
import CarCard from '@/components/car/CarCard'
import { ChevronRight } from 'lucide-react'
import { normalizeBrandKey, pickPreferredBrandName } from '@/lib/brand-utils'

// Remove generateStaticParams for large database
// export function generateStaticParams() { ... }

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const resolved = await params
  const brandSlug = resolved.brand
  
  const allCars = await getAllCars()
  const normalizedBrand = normalizeBrandKey(brandSlug.replace(/-/g, ' '))
  const brandCars = allCars.filter(
    (c) => normalizeBrandKey(c.brand) === normalizedBrand
  )
  const groupedModels = groupCarsByModel(brandCars)
  
  const realBrandName = brandCars.reduce(
    (name, car) => pickPreferredBrandName(name, car.brand),
    brandCars[0]?.brand || brandSlug.replace(/-/g, ' '),
  )

  if (groupedModels.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-text mb-2">Marca não encontrada</h1>
        <p className="text-sm text-text-secondary mb-6">Não foi possível encontrar a marca solicitada.</p>
        <Link href="/marcas" className="text-sm text-primary hover:underline font-medium">&larr; Ver todas as marcas</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <nav className="flex items-center gap-1 text-sm text-text-tertiary mb-6">
        <Link href="/" className="hover:text-text transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/marcas" className="hover:text-text transition-colors">Marcas</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text font-medium">{realBrandName}</span>
      </nav>

      <h1 className="text-2xl font-bold text-text mb-1">{realBrandName}</h1>
      <p className="text-sm text-text-secondary mb-6">
        {groupedModels.length} modelo{groupedModels.length !== 1 ? 's' : ''} • {brandCars.length} versão{brandCars.length !== 1 ? 'ões' : ''} disponível(is)
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {groupedModels.map(({ representative, variants }) => (
          <CarCard
            key={`${representative.brand}-${representative.slug}`}
            car={{
              ...representative,
              version:
                variants.length > 1
                  ? `${variants.length} versões disponíveis`
                  : representative.version,
            }}
          />
        ))}
      </div>
    </div>
  )
}
