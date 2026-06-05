'use client'

interface JSONLDProps {
  data: any
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carbi.com.br'

function absoluteUrl(path = '') {
  return new URL(path, SITE_URL).toString()
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
    'image': absoluteUrl('/logo.png'),
    '@id': SITE_URL,
    'url': SITE_URL,
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
    'url': SITE_URL,
    'logo': absoluteUrl('/logo.png'),
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
      'url': absoluteUrl(`/anuncios/${vehicle.slug}`)
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

export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Carbi',
    'url': SITE_URL,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': absoluteUrl('/carros-a-venda?q={search_term_string}'),
      'query-input': 'required name=search_term_string',
    },
  }

  return <JSONLD data={schema} />
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  }

  return <JSONLD data={schema} />
}

export function FAQSchema({ items }: { items: { q: string; a: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return <JSONLD data={schema} />
}
