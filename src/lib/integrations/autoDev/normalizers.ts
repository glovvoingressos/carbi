import { AutoDevEndpointPayload, JsonValue, VehicleEnrichment } from '@/lib/integrations/autoDev/types'

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function getByPath(input: unknown, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = input

  for (const part of parts) {
    const obj = asObject(current)
    if (!(part in obj)) return undefined
    current = obj[part]
  }

  return current
}

function pickFirst(input: unknown, candidates: string[]): unknown {
  for (const path of candidates) {
    const value = getByPath(input, path)
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }
  return null
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '')
    const parsed = Number(normalized)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function toInteger(value: unknown): number | null {
  const n = toNumber(value)
  return n === null ? null : Math.round(n)
}

function toStringValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const clean = value.trim()
    return clean.length > 0 ? clean : null
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return null
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => toStringValue(item))
      .filter((item): item is string => Boolean(item))
  }

  const str = toStringValue(value)
  return str ? [str] : []
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)))
}

function extractPhotoUrls(payload: unknown): string[] {
  if (!payload) return []

  if (Array.isArray(payload)) {
    return uniq(
      payload
        .map((item) => {
          if (typeof item === 'string') return item
          const obj = asObject(item)
          const maybe = obj.url || obj.imageUrl || obj.href || obj.src
          return typeof maybe === 'string' ? maybe : null
        })
        .filter((item): item is string => Boolean(item)),
    )
  }

  const data = asObject(payload)
  const listCandidates = [data.photos, data.images, data.gallery, data.data]

  for (const candidate of listCandidates) {
    const urls = extractPhotoUrls(candidate)
    if (urls.length > 0) return urls
  }

  const maybeSingle = pickFirst(payload, ['url', 'imageUrl', 'src'])
  return maybeSingle ? toStringArray(maybeSingle) : []
}

function splitPhotoBuckets(urls: string[]): {
  hero: string | null
  gallery: string[]
  interior: string[]
  exterior: string[]
  detail: string[]
} {
  const interior = urls.filter((url) => /interior|inside|cockpit|cabin/i.test(url))
  const exterior = urls.filter((url) => /exterior|outside|front|rear|side/i.test(url))
  const detail = urls.filter((url) => /detail|wheel|dashboard|logo|headlight/i.test(url))

  const gallery = uniq(urls)

  return {
    hero: gallery[0] || null,
    gallery,
    interior: uniq(interior),
    exterior: uniq(exterior.length > 0 ? exterior : gallery),
    detail: uniq(detail),
  }
}

function normalizeRecalls(payload: unknown): VehicleEnrichment['recalls'] {
  const itemsSource = (() => {
    if (Array.isArray(payload)) return payload
    const fromObj = pickFirst(payload, ['items', 'recalls', 'data', 'results'])
    return Array.isArray(fromObj) ? fromObj : []
  })()

  const items = itemsSource
    .map((item) => {
      const obj = asObject(item)
      const title = toStringValue(obj.title || obj.summary || obj.name || obj.component)
      if (!title) return null

      return {
        title,
        description: toStringValue(obj.description || obj.details || obj.notes),
        remedy: toStringValue(obj.remedy || obj.corrective_action),
        risk: toStringValue(obj.risk || obj.consequence),
        recallDate: toStringValue(obj.recallDate || obj.date || obj.published_at),
        sourceLabel: 'Dados internacionais (EUA)',
      }
    })
    .filter(Boolean) as VehicleEnrichment['recalls']['items']

  return {
    count: items.length,
    items,
  }
}

function normalizeFeatures(specs: unknown, build: unknown): VehicleEnrichment['features'] {
  const comfort = uniq(
    toStringArray(pickFirst(specs, ['features.comfort', 'comfort', 'comfortFeatures'])).concat(
      toStringArray(pickFirst(build, ['options.comfort', 'packages.comfort'])),
    ),
  )

  const technology = uniq(
    toStringArray(pickFirst(specs, ['features.technology', 'technology', 'techFeatures'])).concat(
      toStringArray(pickFirst(build, ['options.technology', 'packages.technology'])),
    ),
  )

  const safety = uniq(
    toStringArray(pickFirst(specs, ['features.safety', 'safety', 'safetyFeatures'])).concat(
      toStringArray(pickFirst(build, ['options.safety', 'packages.safety'])),
    ),
  )

  const convenience = uniq(
    toStringArray(pickFirst(specs, ['features.convenience', 'convenience'])).concat(
      toStringArray(pickFirst(build, ['options.convenience', 'packages.convenience'])),
    ),
  )

  const other = uniq(
    toStringArray(pickFirst(specs, ['features.other', 'otherFeatures'])).concat(
      toStringArray(pickFirst(build, ['options.other', 'packages.other'])),
    ),
  )

  return {
    comfort,
    technology,
    safety,
    convenience,
    other,
  }
}

export function normalizeVehicleEnrichment(input: {
  vehicleId: string
  vin: string | null
  payloads: AutoDevEndpointPayload
}): VehicleEnrichment {
  const now = new Date().toISOString()
  const { decode, specs, photos, build, recalls, sourceVersion } = input.payloads

  const photoUrls = extractPhotoUrls(photos)
  const photoBuckets = splitPhotoBuckets(photoUrls)

  const exteriorColors = uniq(
    toStringArray(pickFirst(build, ['colors.exterior', 'exteriorColors'])).concat(
      toStringArray(pickFirst(specs, ['appearance.exteriorColors', 'colors.exterior'])),
    ),
  )

  const interiorColors = uniq(
    toStringArray(pickFirst(build, ['colors.interior', 'interiorColors'])).concat(
      toStringArray(pickFirst(specs, ['appearance.interiorColors', 'colors.interior'])),
    ),
  )

  const enrichment: VehicleEnrichment = {
    vehicleId: input.vehicleId,
    vin: input.vin,
    source: 'auto_dev',
    sourceVersion,
    identity: {
      make: toStringValue(pickFirst(decode, ['make', 'vehicle.make', 'data.make'])) || toStringValue(pickFirst(specs, ['make'])),
      model: toStringValue(pickFirst(decode, ['model', 'vehicle.model', 'data.model'])) || toStringValue(pickFirst(specs, ['model'])),
      year: toInteger(pickFirst(decode, ['year', 'vehicle.year', 'modelYear'])) || toInteger(pickFirst(specs, ['year', 'modelYear'])),
      trim: toStringValue(pickFirst(decode, ['trim', 'vehicle.trim', 'style'])) || toStringValue(pickFirst(build, ['trim', 'build.trim'])),
      bodyType: toStringValue(pickFirst(specs, ['bodyType', 'body_style', 'body.type'])),
      style: toStringValue(pickFirst(specs, ['style', 'styleName'])),
    },
    powertrain: {
      engine: toStringValue(pickFirst(specs, ['engine.description', 'engine', 'powertrain.engine'])),
      horsepower: toInteger(pickFirst(specs, ['horsepower', 'engine.horsepower', 'powertrain.horsepower'])),
      torque: toInteger(pickFirst(specs, ['torque', 'engine.torque', 'powertrain.torque'])),
      transmission: toStringValue(pickFirst(specs, ['transmission', 'powertrain.transmission'])),
      drivetrain: toStringValue(pickFirst(specs, ['drivetrain', 'powertrain.drivetrain'])),
      fuelType: toStringValue(pickFirst(specs, ['fuelType', 'powertrain.fuelType', 'fuel.type'])),
    },
    efficiency: {
      cityMpg: toNumber(pickFirst(specs, ['mpg.city', 'efficiency.cityMpg', 'fuelEconomy.city'])),
      highwayMpg: toNumber(pickFirst(specs, ['mpg.highway', 'efficiency.highwayMpg', 'fuelEconomy.highway'])),
      combinedMpg: toNumber(pickFirst(specs, ['mpg.combined', 'efficiency.combinedMpg', 'fuelEconomy.combined'])),
      consumptionLabel: toStringValue(pickFirst(specs, ['efficiency.label', 'fuelEconomy.label'])),
    },
    dimensions: {
      length: toNumber(pickFirst(specs, ['dimensions.length', 'length'])),
      width: toNumber(pickFirst(specs, ['dimensions.width', 'width'])),
      height: toNumber(pickFirst(specs, ['dimensions.height', 'height'])),
      wheelbase: toNumber(pickFirst(specs, ['dimensions.wheelbase', 'wheelbase'])),
      curbWeight: toNumber(pickFirst(specs, ['dimensions.curbWeight', 'curbWeight'])),
      seatingCapacity: toInteger(pickFirst(specs, ['dimensions.seatingCapacity', 'seatingCapacity', 'seats'])),
      cargoCapacity: toNumber(pickFirst(specs, ['dimensions.cargoCapacity', 'cargoCapacity'])),
    },
    appearance: {
      exteriorColors,
      interiorColors,
    },
    features: normalizeFeatures(specs, build),
    photos: photoBuckets,
    recalls: normalizeRecalls(recalls),
    raw: {
      decode: (decode || null) as JsonValue,
      specs: (specs || null) as JsonValue,
      photos: (photos || null) as JsonValue,
      build: (build || null) as JsonValue,
      recalls: (recalls || null) as JsonValue,
    },
    fetchedAt: now,
    updatedAt: now,
  }

  return enrichment
}
