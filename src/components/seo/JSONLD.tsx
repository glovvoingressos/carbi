'use client'

interface JSONLDProps {
  data: any
}

export default function JSONLD({ data }: JSONLDProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': 'Carbi Marketplace',
    'image': 'https://carbi.com.br/logo.png',
    '@id': 'https://carbi.com.br',
    'url': 'https://carbi.com.br',
    'telephone': '',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Belo Horizonte',
      'addressLocality': 'Belo Horizonte',
      'addressRegion': 'MG',
      'postalCode': '',
      'addressCountry': 'BR'
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': -19.9167,
      'longitude': -43.9333
    },
    'openingHoursSpecification': {
      '@type': 'OpeningHoursSpecification',
      'dayOfWeek': [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      'opens': '00:00',
      'closes': '23:59'
    }
  }
  return <JSONLD data={schema} />
}

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Carbi',
    'url': 'https://www.carbi.com.br',
    'logo': 'https://www.carbi.com.br/logo.png',
    'sameAs': [
      'https://instagram.com/carbi'
    ]
  }
  return <JSONLD data={schema} />
}

export function VehicleSchema({ vehicle }: { vehicle: any }) {
  // Handle both ListingPublic (with price) and CarSpec (catalog)
  const isListing = 'price' in vehicle;
  
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    'name': `${vehicle.brand} ${vehicle.model}`,
    'description': vehicle.description || `Ficha técnica completa do ${vehicle.brand} ${vehicle.model} ${vehicle.year_model || ''}.`,
    'brand': {
      '@type': 'Brand',
      'name': vehicle.brand
    },
    'modelDate': vehicle.year_model || vehicle.year,
    'color': vehicle.color,
    'fuelType': vehicle.fuel || vehicle.engineType,
    'vehicleTransmission': vehicle.transmission,
  }

  if (vehicle.mileage !== undefined) {
    schema.mileageFromOdometer = {
      '@type': 'QuantitativeValue',
      'value': vehicle.mileage,
      'unitCode': 'KMT'
    }
  }

  if (isListing && vehicle.price) {
    schema.offers = {
      '@type': 'Offer',
      'price': vehicle.price,
      'priceCurrency': 'BRL',
      'availability': 'https://schema.org/InStock',
      'url': `https://www.carbi.com.br/anuncios/${vehicle.slug}`
    }
  }

  return <JSONLD data={schema} />
}

export function LocalBusinessBHTicketsSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    'name': 'Carbi Belo Horizonte',
    'description': 'Maior marketplace de carros usados em Belo Horizonte. Venda seu carro com atrito zero.',
    'url': 'https://www.carbi.com.br/carros-usados-bh',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Belo Horizonte',
      'addressRegion': 'MG',
      'addressCountry': 'BR'
    }
  }
  return <JSONLD data={schema} />
}
