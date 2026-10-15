import Link from 'next/link'
import type { CarSpec } from '@/data/cars'
import CarImage from '@/components/car/CarImage'
import { slugifyBrand } from '@/lib/brand-utils'
import { canonicalModelSlug } from '@/lib/vehicle-slug'

interface CompareTableProps {
  cars: CarSpec[]
  winners: Record<string, string>
}

function WinnerPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#10B981] text-[13px] font-medium tracking-tight">
      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
      {children}
    </span>
  )
}

export default function CompareTable({ cars, winners }: CompareTableProps) {
  const rows: Array<{ label: string; render: (car: CarSpec) => React.ReactNode; winner?: string }> = [
    { label: 'Ano-modelo', render: (car) => String(car.year) },
    {
      label: 'Motor',
      render: (car) => `${car.engineType} ${car.displacement} ${car.turbo ? 'Turbo' : ''}`.trim(),
    },
    {
      label: 'Potência',
      winner: winners.horsepower,
      render: (car) => `${car.horsepower} cv`,
    },
    {
      label: 'Torque',
      winner: winners.torque,
      render: (car) => `${car.torque} Nm`,
    },
    {
      label: 'Transmissão',
      render: (car) => car.transmission,
    },
    {
      label: 'Consumo na cidade',
      winner: winners.fuelEconomyCityGas,
      render: (car) => car.fuelEconomyCityGas > 0
        ? car.engineType === 'Flex' && car.fuelEconomyCityEthanol
          ? `${car.fuelEconomyCityGas} km/l (gasolina) · ${car.fuelEconomyCityEthanol} km/l (etanol)`
          : `${car.fuelEconomyCityGas} km/l (${car.engineType.toLocaleLowerCase('pt-BR')})`
        : 'Não informado',
    },
    {
      label: '0-100 km/h',
      render: (car) => `${car.acceleration0100}s`,
    },
    {
      label: 'Caçamba / porta-malas',
      winner: winners.trunkCapacity,
      render: (car) => `${car.trunkCapacity} L`,
    },
    {
      label: 'Airbags',
      winner: winners.airbagsCount,
      render: (car) => `${car.airbagsCount}`,
    },
    {
      label: 'Latin NCAP',
      winner: winners.latinNcap,
      render: (car) => car.latinNcap > 0 ? `${car.latinNcap} estrelas` : 'Não testado',
    },
  ]

  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {cars.map((car) => {
          return (
            <Link href={`/${slugifyBrand(car.brand)}/${canonicalModelSlug(car.model)}`} key={car.id} className="bg-white border border-[#EAEAE8] rounded-2xl p-4 hover:border-[#0A0A0A] transition-colors">
              <div className="w-full aspect-square rounded-xl mb-3 overflow-hidden bg-[#FAFAF9] border border-[#EAEAE8]">
                <CarImage id={car.id} brand={car.brand} model={car.model} year={car.year} src={car.image} strict fit="cover" aspectRatio="1/1" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-[14px] font-semibold text-[#0A0A0A] tracking-tight">{car.brand} {car.model}</h3>
              <p className="text-[12px] text-[#A3A3A3] mt-0.5">{car.version}</p>
              <p className="text-[12px] text-[#52607A] mt-2">Consulte a FIPE por versão e ano</p>
            </Link>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#EAEAE8] rounded-2xl overflow-hidden divide-y divide-[#EAEAE8]">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-1 md:grid-cols-[200px_repeat(3,_1fr)] lg:grid-cols-[200px_repeat(4,_1fr)] hover:bg-[#FAFAF9] transition-colors">
            <div className="px-4 py-4 flex items-center">
              <span className="eyebrow">{row.label}</span>
            </div>
            <div className="col-span-full md:col-span-3 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {cars.map((car) => {
                const isWinner = row.winner === car.id
                return (
                  <div key={car.id} className="px-4 py-4 flex items-center justify-start md:justify-center text-[14px] text-[#0A0A0A] tracking-tight">
                    {isWinner ? <WinnerPill>{row.render(car)}</WinnerPill> : row.render(car)}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
