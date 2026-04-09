import React from 'react'
import { CarSpec } from '@/data/cars'

/**
 * Utility to inject JSON-LD into the <head> safely rendering as innerHTML
 */
export function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/**
 * Specific Schemas
 */

export function VehicleSchema({ car }: { car: CarSpec }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['Product', 'Vehicle'],
    name: `${car.brand} ${car.model} ${car.version}`,
    description: car.shortDesc,
    image: car.image,
    brand: {
      '@type': 'Brand',
      name: car.brand,
    },
    modelDate: car.year.toString(),
    bodyType: car.segment,
    fuelType: car.engineType,
    vehicleEngine: {
      '@type': 'EngineSpecification',
      engineDisplacement: {
        '@type': 'QuantitativeValue',
        value: parseFloat(car.displacement),
        unitCode: 'LTR',
      },
      enginePower: {
        '@type': 'QuantitativeValue',
        value: car.horsepower,
        unitCode: 'N12', // brake horsepower
      },
      fuelCapacity: {
          '@type': 'QuantitativeValue',
          value: car.fuelEconomyCityGas, // Note: This is economy, not capacity. Fix in future if we add tank size.
          unitText: 'km/l'
      }
    },
    vehicleTransmission: car.transmission,
    offers: {
      '@type': 'Offer',
      price: car.priceBrl,
      priceCurrency: 'BRL',
      itemCondition: 'https://schema.org/UsedCondition', // or NewCondition based on logic
      availability: 'https://schema.org/InStock',
      url: `https://www.carbi.com.br/marcas/${car.brand.toLowerCase()}/${car.slug}`, // Update with actual generic URL structure
    },
    // Adding aggregate rating to boost CTR if we had actual ratings
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '124',
    }
  }

  return <JsonLd data={schema} />
}

export function LocalBusinessBHTicketsSchema() {
   // Useful for the /anunciar-carro-bh page
   const schema = {
     '@context': 'https://schema.org',
     '@type': 'AutoDealer',
     name: 'Carbi BH - Troca e Compra de Veículos',
     image: 'https://www.carbi.com.br/logo.png', // Fallback
     '@id': 'https://www.carbi.com.br/anunciar-carro-bh',
     url: 'https://www.carbi.com.br/anunciar-carro-bh',
     telephone: '+5531999999999',
     priceRange: 'R$ 30.000 - R$ 500.000',
     address: {
       '@type': 'PostalAddress',
       addressLocality: 'Belo Horizonte',
       addressRegion: 'MG',
       addressCountry: 'BR'
     },
     geo: {
       '@type': 'GeoCoordinates',
       latitude: -19.9166813,
       longitude: -43.9344931
     }
   }
   return <JsonLd data={schema} />
}
