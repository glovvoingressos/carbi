import Link from 'next/link'
import { cars } from '@/data/cars'
import CarCard from '@/components/car/CarCard'
import { ChevronRight } from 'lucide-react'

export function generateStaticParams() {
  const brandSlugs = [
    ...new Set(cars.map((c) => c.brand.toLowerCase().replace(/\s+/g, '-'))),
  ]
  return brandSlugs.map((brand) => ({ brand }))
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const resolved = await params
  const brandName = resolved.brand.replace(/-/g, ' ')
  const brandCars = cars.filter(
    (c) => c.brand.toLowerCase().replace(/\s+/g, '-') === resolved.brand
  )
  const realBrandName = brandCars[0]?.brand || brandName

  if (brandCars.length === 0) {
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
      <p className="text-sm text-text-secondary mb-6">{brandCars.length} modelo{brandCars.length !== 1 ? 's' : ''} disponível(is)</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {brandCars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
    </div>
  )
}
