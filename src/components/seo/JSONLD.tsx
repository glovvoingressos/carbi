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

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Carbi',
    'url': SITE_URL,
    'logo': absoluteUrl('/logo.svg'),
  }
  return <JSONLD data={schema} />
}

export function VehicleSchema({ vehicle }: { vehicle: any }) {
  // Handle both ListingPublic (with price) and CarSpec (catalog)
  const isListing = 'price' in vehicle;
  const isTruck = vehicle.vehicle_type === 'truck'
  const listingUrl = isTruck
    ? `/caminhoes/anuncio/${vehicle.slug}`
    : `/anuncios/${vehicle.slug}`
  const vehicleName = [vehicle.brand, vehicle.model, vehicle.version, vehicle.year_model || vehicle.year]
    .filter(Boolean)
    .join(' ')
  const imageUrls = Array.isArray(vehicle.images)
    ? vehicle.images.map((image: { url?: string }) => image?.url).filter(Boolean)
    : []

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': isTruck ? 'Vehicle' : 'Car',
    'name': vehicleName,
    ...(typeof vehicle.description === 'string' && vehicle.description.trim()
      ? { description: vehicle.description.trim() }
      : {}),
      'brand': {
        '@type': 'Brand',
        'name': vehicle.brand
      },
    'color': vehicle.color,
    'fuelType': vehicle.fuel || vehicle.fuelType,
    'vehicleTransmission': vehicle.transmission,
  }

  if (imageUrls.length > 0) schema.image = imageUrls
  else if (typeof vehicle.image === 'string' && vehicle.image.trim()) {
    schema.image = [absoluteUrl(vehicle.image.trim())]
  }
  if (vehicle.version) schema.vehicleConfiguration = vehicle.version
  if (isListing) {
    schema.url = absoluteUrl(listingUrl)
    schema.itemCondition = 'https://schema.org/UsedCondition'
  }

  if (isTruck && vehicle.axles != null) schema.numberOfAxles = vehicle.axles
  if (isTruck && vehicle.load_capacity != null) {
    schema.payload = {
      '@type': 'QuantitativeValue',
      value: vehicle.load_capacity,
      unitCode: 'KGM',
    }
  }

  if (vehicle.mileage !== undefined) {
    schema.mileageFromOdometer = {
      '@type': 'QuantitativeValue',
      'value': vehicle.mileage,
      'unitCode': 'KMT'
    }
  }

  if (isListing && vehicle.price != null) {
    schema.offers = {
      '@type': 'Offer',
      'price': vehicle.price,
      'priceCurrency': 'BRL',
      'availability': vehicle.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      'url': absoluteUrl(listingUrl)
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

export function FAQSchema(_props: { items: { q: string; a: string }[] }) {
  return null
}
