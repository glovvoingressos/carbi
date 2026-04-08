import Link from 'next/link'
import { getAllCars } from '@/lib/data-fetcher'

export default async function MarcasPage() {
  const cars = await getAllCars()
  const brands = [...new Set(cars.map(c => c.brand))].sort()

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="mb-12 text-center flex flex-col items-center">
          <div className="bg-[var(--color-bento-blue)] text-white px-4 py-1.5 rounded-full font-black text-[11px] tracking-widest uppercase border-2 border-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A] mb-4 -rotate-2">Catálogo Oficial</div>
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
                className="group relative bg-[#f4f6f8] border-2 border-[#0A0A0A] rounded-[32px] p-6 pt-8 text-center shadow-[4px_4px_0_#0A0A0A] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_#0A0A0A] hover:bg-white flex flex-col items-center justify-center overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#00D632] opacity-0 group-hover:opacity-10 transition-opacity rounded-bl-full"></div>
                
                <div className="w-14 h-14 bg-white border-2 border-[#0A0A0A] rounded-full shadow-[2px_2px_0_#0A0A0A] flex items-center justify-center mb-4 group-hover:bg-[#00D632] group-hover:shadow-[2px_2px_0_#00D632] transition-colors relative z-10">
                  <span className="font-black text-xl text-[#0A0A0A] uppercase">{brand.charAt(0)}</span>
                </div>

                <p className="text-xl font-black text-[#0A0A0A] tracking-tight relative z-10">{brand}</p>
                <p className="text-[11px] font-bold text-[#0A0A0A]/50 mt-1.5 uppercase tracking-widest relative z-10">
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

