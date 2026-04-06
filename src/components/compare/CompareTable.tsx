import Link from 'next/link'
import type { CarSpec } from '@/data/cars'
import { formatBRL } from '@/data/cars'

interface CompareRowProps {
  label: string
  values: (string | number)[]
  lowerIsBetter?: boolean
  unit?: string
  highlightWinner?: boolean | null
}

function CompareRow({ label, values, lowerIsBetter, unit = '', highlightWinner = true }: CompareRowProps) {
  return (
    <div className="grid border-b border-gray-100 hover:bg-gray-50">
      <div className="flex items-center px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700 col-span-1">
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
                isWinner === true ? 'font-bold text-green-600' : 'text-gray-900'
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4 px-4">
        {cars.map((car) => {
          const brandSlug = car.brand.toLowerCase().replace(/\s+/g, '-')
          return (
            <Link href={`/${brandSlug}/${car.slug}`} className="bg-white rounded-lg p-4 border text-center hover:border-blue-300 transition-colors" key={car.id}>
              <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-28 object-cover rounded-md mb-2" width={200} height={112} />
              <h3 className="font-bold text-sm">{car.brand} {car.model}</h3>
              <p className="text-xs text-gray-500">{car.version}</p>
              <p className="text-blue-600 font-bold text-sm mt-1">{formatBRL(car.priceBrl)}</p>
            </Link>
          )
        })}
      </div>

      {/* Table rows */}
      <div className="bg-white rounded-lg border divide-y divide-gray-100">
        {/* Price */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-gray-50">
          <div className="flex items-center px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700">Preço</div>
          {cars.map((car) => {
            const isWinner = winners.priceBrl === car.id
            return (
              <div key={car.id} className={`flex justify-center px-4 py-3 text-sm ${isWinner ? 'font-bold text-green-600 bg-green-50' : 'text-gray-900'}`}>
                {formatBRL(car.priceBrl)}
                {isWinner && <span className="text-xs ml-1">(menor)</span>}
              </div>
            )
          })}
        </div>

        {/* Motor */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-gray-50">
          <div className="flex items-center px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700">Motor</div>
          {cars.map((car) => (
            <div key={car.id} className="flex justify-center px-4 py-3 text-sm text-gray-900">
              {car.engineType} {car.displacement} {car.turbo ? 'Turbo' : ''}
            </div>
          ))}
        </div>

        {/* Potência */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-gray-50">
          <div className="flex items-center px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700">Potência</div>
          {cars.map((car) => {
            const isWinner = winners.horsepower === car.id
            return (
              <div key={car.id} className={`flex justify-center px-4 py-3 text-sm ${isWinner ? 'font-bold text-green-600 bg-green-50' : 'text-gray-900'}`}>
                {car.horsepower} cv
              </div>
            )
          })}
        </div>

        {/* Torque */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-gray-50">
          <div className="flex items-center px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700">Torque</div>
          {cars.map((car) => (
            <div key={car.id} className={`flex justify-center px-4 py-3 text-sm ${winners.torque === car.id ? 'font-bold text-green-600 bg-green-50' : 'text-gray-900'}`}>
              {car.torque} Nm
            </div>
          ))}
        </div>

        {/* Transmissão */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-gray-50">
          <div className="flex items-center px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700">Transmissão</div>
          {cars.map((car) => (
            <div key={car.id} className="flex justify-center px-4 py-3 text-sm text-gray-900">
              {car.transmission}
            </div>
          ))}
        </div>

        {/* Consumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-gray-50">
          <div className="flex items-center px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700">Consumo (cidade)</div>
          {cars.map((car) => (
            <div key={car.id} className={`flex justify-center px-4 py-3 text-sm ${winners.fuelEconomyCityGas === car.id ? 'font-bold text-green-600 bg-green-50' : 'text-gray-900'}`}>
              {car.fuelEconomyCityGas} km/l
            </div>
          ))}
        </div>

        {/* 0-100 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-gray-50">
          <div className="flex items-center px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700">0-100 km/h</div>
          {cars.map((car) => (
            <div key={car.id} className="flex justify-center px-4 py-3 text-sm text-gray-900">
              {car.acceleration0100}s
            </div>
          ))}
        </div>

        {/* Porta-malas */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-gray-50">
          <div className="flex items-center px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700">Porta-malas</div>
          {cars.map((car) => (
            <div key={car.id} className={`flex justify-center px-4 py-3 text-sm ${winners.trunkCapacity === car.id ? 'font-bold text-green-600 bg-green-50' : 'text-gray-900'}`}>
              {car.trunkCapacity} L
            </div>
          ))}
        </div>

        {/* Airbags */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-gray-50">
          <div className="flex items-center px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700">Airbags</div>
          {cars.map((car) => (
            <div key={car.id} className={`flex justify-center px-4 py-3 text-sm ${winners.airbagsCount === car.id ? 'font-bold text-green-600 bg-green-50' : 'text-gray-900'}`}>
              {car.airbagsCount}
            </div>
          ))}
        </div>

        {/* Latin NCAP */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hover:bg-gray-50">
          <div className="flex items-center px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700">Latin NCAP</div>
          {cars.map((car) => (
            <div key={car.id} className={`flex justify-center px-4 py-3 text-sm ${winners.latinNcap === car.id ? 'font-bold text-green-600 bg-green-50' : 'text-gray-900'}`}>
              {car.latinNcap > 0 ? `${car.latinNcap} estrelas` : 'Não testado'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
