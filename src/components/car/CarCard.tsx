import Link from 'next/link'
import type { CarSpec } from '@/data/cars'
import { formatBRL } from '@/data/cars'
import Badge from '@/components/ui/Badge'
import { Fuel, Gauge, Package } from 'lucide-react'

interface CarCardProps {
  car: CarSpec
}

export default function CarCard({ car }: CarCardProps) {
  const brandSlug = car.brand.toLowerCase().replace(/\s+/g, '-')

  const badges: { show: boolean; label: string; variant: 'default' | 'success' | 'accent' | 'subtle' }[] = [
    { show: car.tags.includes('economico'), label: 'Econômico', variant: 'success' },
    { show: car.tags.includes('familia'), label: 'Família', variant: 'default' },
    { show: car.tags.includes('tecnologia'), label: 'Tecnologia', variant: 'accent' },
  ].filter(b => b.show)

  return (
    <Link href={`/${brandSlug}/${car.slug}`} className="block card-hover">
      <article className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="aspect-[4/3] bg-border overflow-hidden">
          <img
            src={car.image}
            alt={`${car.brand} ${car.model}`}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            width={400}
            height={300}
            loading="lazy"
          />
        </div>

        <div className="p-3.5">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-0.5">{car.brand}</p>
          <h3 className="text-sm font-bold text-text leading-tight">{car.model}</h3>
          <p className="text-xs text-text-secondary mt-0.5">{car.version}</p>

          <p className="text-base font-bold text-primary mt-2">{formatBRL(car.priceBrl)}</p>

          <div className="flex items-center gap-3 mt-2.5 text-text-secondary text-xs">
            <span className="inline-flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5" />
              {car.fuelEconomyCityGas}
            </span>
            <span className="inline-flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />
              {car.horsepower} cv
            </span>
            <span className="inline-flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              {car.trunkCapacity} L
            </span>
          </div>

          {badges.length > 0 && (
            <div className="flex gap-1 mt-2.5 flex-wrap">
              {badges.map(b => (
                <Badge key={b.label} variant={b.variant}>{b.label}</Badge>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
