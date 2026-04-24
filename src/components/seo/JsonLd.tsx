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
    'url': 'https://carbi.com.br',
    'logo': 'https://carbi.com.br/logo.png',
    'sameAs': [
      'https://instagram.com/carbi'
    ]
  }
  return <JSONLD data={schema} />
}
