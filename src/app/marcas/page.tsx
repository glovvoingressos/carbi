import Link from 'next/link'
import { getAllCars } from '@/lib/data-fetcher'
import BrandLogo from '@/components/brand/BrandLogo'

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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {brands.map((brand, i) => {
            const brandCars = cars.filter((c) => c.brand === brand)
            const slug = brand.toLowerCase().replace(/\s+/g, '-')
            
            // Basic domain mapping for Clearbit Logo API
            const getDomain = (b: string) => {
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
              return map[b.toLowerCase()] || `${b.toLowerCase().replace(/\s+/g, '')}.com`
            }

            // Alternate colors for variety
            const colors = ['#b4d2ff', '#E8D4FF', '#fff9d4', '#ffccd5']
            const bgColor = colors[i % colors.length]

            return (
              <Link
                key={brand}
                href={`/marcas/${slug}`}
                className="group relative bg-white border-2 border-dark rounded-[32px] p-6 text-center shadow-[4px_4px_0_#0A0A0A] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_#0A0A0A] flex flex-col items-center justify-center overflow-hidden"
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border-2 border-dark shadow-sm bg-white p-2 relative z-10"
                  style={{ backgroundColor: bgColor }}
                >
                  <BrandLogo 
                    brandName={brand} 
                    domain={getDomain(brand)} 
                    className="w-full h-full object-contain filter drop-shadow-sm mix-blend-multiply" 
                  />
                </div>

                <p className="text-xl font-black text-dark tracking-tight relative z-10 uppercase">{brand}</p>
                <div className="mt-3">
                   <span className="bg-surface text-text-secondary border border-border font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-widest relative z-10 group-hover:bg-dark group-hover:text-white transition-colors">
                     {brandCars.length} modelo{brandCars.length !== 1 ? 's' : ''}
                   </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

