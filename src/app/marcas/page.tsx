import Link from 'next/link'
import { brands, cars } from '@/data/cars'

export default function MarcasPage() {
  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text">Marcas</h1>
          <p className="text-sm text-text-secondary mt-1">Escolha uma marca para ver os modelos disponíveis.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {brands.map((brand) => {
            const brandCars = cars.filter((c) => c.brand === brand)
            const slug = brand.toLowerCase().replace(/\s+/g, '-')
            return (
              <Link
                key={brand}
                href={`/marcas/${slug}`}
                className="card-hover bg-white border border-border rounded-xl p-5 text-center"
              >
                <p className="text-sm font-semibold text-text">{brand}</p>
                <p className="text-xs text-text-tertiary mt-1">
                  {brandCars.length} modelo{brandCars.length !== 1 ? 's' : ''}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
