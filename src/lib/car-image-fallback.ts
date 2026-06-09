import { availableCarAssetPaths } from '@/data/carAssetManifest'

export const CAR_IMAGE_SIZE = 1080

export function getCarImageUrl(url: string | null | undefined, size: number = CAR_IMAGE_SIZE): string | null {
  if (!url) return null
  if (url.includes('supabase.co/storage/')) {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}width=${size}&height=${size}&resize=cover&quality=80`
  }
  return url
}

function addUniqueUrl(urls: string[], url: string | null | undefined) {
  const value = url?.trim()
  if (!value || urls.includes(value)) return
  urls.push(value)
}

export function getCarImageCandidates(
  urls: Array<string | null | undefined>,
  size: number = CAR_IMAGE_SIZE,
): string[] {
  const candidates: string[] = []

  for (const url of urls) {
    const value = url?.trim()
    if (!value) continue
    addUniqueUrl(candidates, getCarImageUrl(value, size))
    addUniqueUrl(candidates, value)
  }

  return candidates
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function tokenize(value: string): string[] {
  return slug(value).split('-').filter(Boolean)
}

export function resolveMarketplaceCarImage(params: {
  brand: string
  model: string
  year?: number
  preferredUrl?: string | null
}): string | null {
  const { brand, model, year, preferredUrl } = params

  if (preferredUrl && preferredUrl.trim()) return preferredUrl

  const brandSlug = slug(brand)
  const modelSlug = slug(model)
  const brandVariants = [
    brandSlug,
    brandSlug.replace('volkswagen', 'vw'),
    brandSlug.replace('caoa-chery', 'cao-chery'),
  ]

  const numericYear = typeof year === 'number' && Number.isFinite(year) ? year : null
  const yearCandidates = numericYear ? [numericYear, numericYear - 1, numericYear - 2, 2026, 2025, 2024] : [2026, 2025, 2024]

  const directCandidates = brandVariants.flatMap((b) => ([
    `/assets/cars/${b}-${modelSlug}.png`,
    ...yearCandidates.map((y) => `/assets/cars/${b}-${modelSlug}-${y}.png`),
  ]))

  for (const candidate of directCandidates) {
    if (availableCarAssetPaths.has(candidate)) return candidate
  }

  const modelTokens = tokenize(model)
  const ranked = Array.from(availableCarAssetPaths)
    .map((assetPath) => {
      const file = assetPath.replace('/assets/cars/', '').replace('.png', '')
      const fileTokens = file.split('-').filter(Boolean)
      let score = 0
      if (file.includes(`${brandSlug}-`) || (brandSlug === 'volkswagen' && file.includes('vw-'))) score += 30
      for (const token of modelTokens) {
        if (fileTokens.includes(token)) score += 9
      }
      if (numericYear && file.endsWith(`-${numericYear}`)) score += 8
      if (file.endsWith('-2026')) score += 3
      if (file.endsWith('-2025')) score += 2
      return { assetPath, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return ranked[0]?.assetPath || null
}

export function resolveMarketplaceCarImageCandidates(params: {
  brand: string
  model: string
  year?: number
  preferredUrls?: Array<string | null | undefined>
  preferredUrl?: string | null
}): string[] {
  const uploaded = getCarImageCandidates([
    ...(params.preferredUrls || []),
    params.preferredUrl,
  ])

  const fallback = resolveMarketplaceCarImage({
    brand: params.brand,
    model: params.model,
    year: params.year,
    preferredUrl: null,
  })

  return getCarImageCandidates([...uploaded, fallback])
}
