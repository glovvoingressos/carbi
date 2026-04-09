import Link from 'next/link'
import { getAllCars } from '@/lib/data-fetcher'

export default async function MarcasPage() {
  const cars = await getAllCars()
  const brands = [...new Set(cars.map(c => c.brand))].sort()

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="mb-12 text-center flex flex-col items-center">
          <div className="bg-[#f0f4f8] text-[#0A0A0A] px-5 py-2 rounded-full font-bold text-[12px] tracking-widest uppercase mb-6 shadow-sm">Catálogo Oficial</div>
          <h1 className="text-4xl md:text-6xl font-black text-[#0A0A0A] tracking-[-0.04em] uppercase mb-4">Marcas de<br/>Carros</h1>
          <p className="text-base text-[#0A0A0A]/60 font-semibold max-w-lg mx-auto">Explore nosso catálogo Premium com projeção FIPE e dados detalhados para cada montadora.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {brands.map((brand) => {
            const brandCars = cars.filter((c) => c.brand === brand)
            const slug = brand.toLowerCase().replace(/\s+/g, '-')
            return (
              <Link
                key={brand}
                href={`/marcas/${slug}`}
                className="group relative bg-white border border-black/5 rounded-[32px] p-6 pt-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col items-center justify-center overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D632] opacity-0 group-hover:opacity-5 transition-opacity rounded-bl-full"></div>
                
                <div className="w-14 h-14 bg-[#f4f6f8] rounded-full flex items-center justify-center mb-5 group-hover:bg-[#00D632] group-hover:text-white transition-colors relative z-10">
                  <span className="font-bold text-xl uppercase tracking-tight">{brand.charAt(0)}</span>
                </div>

                <p className="text-xl font-normal font-heading text-[#0A0A0A] tracking-wide relative z-10">{brand}</p>
                <p className="text-[12px] font-semibold text-[#0A0A0A]/40 mt-1.5 uppercase tracking-widest relative z-10">
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

