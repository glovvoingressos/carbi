'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { Gauge, Fuel, Zap, Shield, ArrowRight } from 'lucide-react'

interface CarComparison {
  brand: string
  model: string
  version: string
  segment: string
  priceBrl: number
  horsepower: number
  fuelEconomyCityGas: number
  airbagsCount: number
  slug: string
  image: string
  idealFor: string
}

interface ModelComparisonProps {
  cars: CarComparison[]
}

export default function ModelComparison({ cars }: ModelComparisonProps) {
  const formatPrice = (price: number) => {
    if (price >= 1000) return `R$ ${(price / 1000).toFixed(0)} mil`
    return `R$ ${price}`
  }

  const specs = [
    { key: 'horsepower', label: 'Potência', icon: Gauge, format: (v: number) => `${v} cv` },
    { key: 'fuelEconomyCityGas', label: 'Consumo', icon: Fuel, format: (v: number) => `${v} km/l` },
    { key: 'airbagsCount', label: 'Airbags', icon: Shield, format: (v: number) => `${v}x` },
  ]

  return (
    <div className="comparison-card">
      <div className="comparison-header">
        <div>
          <div className="comparison-label">Comparativo</div>
          <h3 className="comparison-title">Encontre o carro ideal</h3>
        </div>
        <Link href="/qual-carro" className="comparison-link">
          Ver todos <ArrowRight size={14} />
        </Link>
      </div>

      <div className="comparison-grid">
        {cars.map((car, i) => (
          <motion.div
            key={car.slug}
            className="comparison-col"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Link href={`/carros/${car.slug}`} className="comparison-car-link">
              <div className="comparison-car-header">
                <div className="comparison-car-segment">{car.segment}</div>
                <div className="comparison-car-name">
                  <span className="comparison-car-brand">{car.brand}</span>
                  <span className="comparison-car-model">{car.model}</span>
                </div>
                <div className="comparison-car-version">{car.version}</div>
                <div className="comparison-car-price">{formatPrice(car.priceBrl)}</div>
              </div>

              <div className="comparison-specs">
                {specs.map((spec) => {
                  const Icon = spec.icon
                  const value = car[spec.key as keyof CarComparison] as number
                  return (
                    <div key={spec.key} className="comparison-spec">
                      <Icon size={14} className="comparison-spec-icon" />
                      <div className="comparison-spec-info">
                        <span className="comparison-spec-label">{spec.label}</span>
                        <span className="comparison-spec-value">{spec.format(value)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="comparison-ideal">
                <Zap size={12} />
                <span>{car.idealFor}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
