import Link from 'next/link'
import type { CarSpec } from '@/data/cars'
import { formatBRL } from '@/data/cars'
import CarImage from '@/components/car/CarImage'

interface CompareRowProps {
  label: string
  values: (string | number)[]
  lowerIsBetter?: boolean
  unit?: string
  highlightWinner?: boolean | null
}

function CompareRow({ label, values, lowerIsBetter, unit = '', highlightWinner = true }: CompareRowProps) {
  return (
    <div className="grid border-b border-border/60 hover:bg-bg-alt/30 transition-colors">
      <div className="flex items-center px-4 py-3 bg-bg-alt/70 font-semibold text-xs text-text-secondary uppercase tracking-wider col-span-1">
        {label}
      </div>
      <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {values.map((val, i) => {
          const numVals = values
            .map((v) => (typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.,-]/g, ''))))
            .filter((n) => !isNaN(n))
          const isWinner = highlightWinner && typeof val === 'number' && numVals.length > 1;
          return (
            <span
              key={i}
              className={`text-center text-sm ${
                isWinner === true ? 'font-semibold text-success bg-success/10 px-2.5 py-0.5 rounded-full' : 'text-text-primary'
              }`}
            >
              {typeof val === 'number' ? val.toLocaleString('pt-BR') + unit : val}
            </span>
          )
        })}
      </div>
    </div>
  )
}

interface CompareTableProps {
  cars: CarSpec[]
  winners: Record<string, string>
}

export default function CompareTable({ cars, winners }: CompareTableProps) {
  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 px-4">
        {cars.map((car) => {
          const brandSlug = car.brand.toLowerCase().replace(/\s+/g, '-')
          return (
            <Link href={`/${brandSlug}/${car.slug}`} className="card p-4 text-center hover:shadow-md transition-all duration-200" key={car.id}>
              <div className="w-full h-28 rounded-xl mb-3 overflow-hidden bg-bg-alt border border-border">
                <CarImage
                  id={car.id}
                  brand={car.brand}
                  model={car.model}
                  year={car.year}
                  src={car.image}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-bold text-sm text-text-primary">{car.brand} {car.model}</h3>
              <p className="text-xs text-text-secondary mt-0.5">{car.version}</p>
              <p className="text-accent font-display font-bold text-sm mt-2">{formatBRL(car.priceBrl)}</p>
            </Link>
          )
        })}
      </div>

      {/* Table rows */}
      <div className="bg-card rounded-2xl border border-border divide-y divide-border/60 overflow-hidden shadow-sm">
        {/* Price */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-bg-alt/30 transition-colors">
          <div className="flex items-center px-4 py-3 bg-bg-alt/70 font-semibold text-xs text-text-secondary uppercase tracking-wider">Preço</div>
          {cars.map((car) => {
            const isWinner = winners.priceBrl === car.id
            return (
              <div key={car.id} className={`flex justify-center items-center px-4 py-3 text-sm ${isWinner ? 'font-semibold text-success bg-success/10 rounded-lg m-1' : 'text-text-primary'}`}>
                {formatBRL(car.priceBrl)}
                {isWinner && <span className="text-xs ml-1.5 font-bold">(menor)</span>}
              </div>
            )
          })}
        </div>

        {/* Motor */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-bg-alt/30 transition-colors">
          <div className="flex items-center px-4 py-3 bg-bg-alt/70 font-semibold text-xs text-text-secondary uppercase tracking-wider">Motor</div>
          {cars.map((car) => (
            <div key={car.id} className="flex justify-center items-center px-4 py-3 text-sm text-text-primary">
              {car.engineType} {car.displacement} {car.turbo ? 'Turbo' : ''}
            </div>
          ))}
        </div>

        {/* Potência */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-bg-alt/30 transition-colors">
          <div className="flex items-center px-4 py-3 bg-bg-alt/70 font-semibold text-xs text-text-secondary uppercase tracking-wider">Potência</div>
          {cars.map((car) => {
            const isWinner = winners.horsepower === car.id
            return (
              <div key={car.id} className={`flex justify-center items-center px-4 py-3 text-sm ${isWinner ? 'font-semibold text-success bg-success/10 rounded-lg m-1' : 'text-text-primary'}`}>
                {car.horsepower} cv
              </div>
            )
          })}
        </div>

        {/* Torque */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-bg-alt/30 transition-colors">
          <div className="flex items-center px-4 py-3 bg-bg-alt/70 font-semibold text-xs text-text-secondary uppercase tracking-wider">Torque</div>
          {cars.map((car) => (
            <div key={car.id} className={`flex justify-center items-center px-4 py-3 text-sm ${winners.torque === car.id ? 'font-semibold text-success bg-success/10 rounded-lg m-1' : 'text-text-primary'}`}>
              {car.torque} Nm
            </div>
          ))}
        </div>

        {/* Transmissão */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-bg-alt/30 transition-colors">
          <div className="flex items-center px-4 py-3 bg-bg-alt/70 font-semibold text-xs text-text-secondary uppercase tracking-wider">Transmissão</div>
          {cars.map((car) => (
            <div key={car.id} className="flex justify-center items-center px-4 py-3 text-sm text-text-primary">
              {car.transmission}
            </div>
          ))}
        </div>

        {/* Consumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-bg-alt/30 transition-colors">
          <div className="flex items-center px-4 py-3 bg-bg-alt/70 font-semibold text-xs text-text-secondary uppercase tracking-wider">Consumo (cidade)</div>
          {cars.map((car) => (
            <div key={car.id} className={`flex justify-center items-center px-4 py-3 text-sm ${winners.fuelEconomyCityGas === car.id ? 'font-semibold text-success bg-success/10 rounded-lg m-1' : 'text-text-primary'}`}>
              {car.fuelEconomyCityGas} km/l
            </div>
          ))}
        </div>

        {/* 0-100 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-bg-alt/30 transition-colors">
          <div className="flex items-center px-4 py-3 bg-bg-alt/70 font-semibold text-xs text-text-secondary uppercase tracking-wider">0-100 km/h</div>
          {cars.map((car) => (
            <div key={car.id} className="flex justify-center items-center px-4 py-3 text-sm text-text-primary">
              {car.acceleration0100}s
            </div>
          ))}
        </div>

        {/* Porta-malas */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-bg-alt/30 transition-colors">
          <div className="flex items-center px-4 py-3 bg-bg-alt/70 font-semibold text-xs text-text-secondary uppercase tracking-wider">Porta-malas</div>
          {cars.map((car) => (
            <div key={car.id} className={`flex justify-center items-center px-4 py-3 text-sm ${winners.trunkCapacity === car.id ? 'font-semibold text-success bg-success/10 rounded-lg m-1' : 'text-text-primary'}`}>
              {car.trunkCapacity} L
            </div>
          ))}
        </div>

        {/* Airbags */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-bg-alt/30 transition-colors">
          <div className="flex items-center px-4 py-3 bg-bg-alt/70 font-semibold text-xs text-text-secondary uppercase tracking-wider">Airbags</div>
          {cars.map((car) => (
            <div key={car.id} className={`flex justify-center items-center px-4 py-3 text-sm ${winners.airbagsCount === car.id ? 'font-semibold text-success bg-success/10 rounded-lg m-1' : 'text-text-primary'}`}>
              {car.airbagsCount}
            </div>
          ))}
        </div>

        {/* Latin NCAP */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-bg-alt/30 transition-colors">
          <div className="flex items-center px-4 py-3 bg-bg-alt/70 font-semibold text-xs text-text-secondary uppercase tracking-wider">Latin NCAP</div>
          {cars.map((car) => (
            <div key={car.id} className={`flex justify-center items-center px-4 py-3 text-sm ${winners.latinNcap === car.id ? 'font-semibold text-success bg-success/10 rounded-lg m-1' : 'text-text-primary'}`}>
              {car.latinNcap > 0 ? `${car.latinNcap} estrelas` : 'Não testado'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
