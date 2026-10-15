/**
 * Local catalog files whose bytes are reused under names for different models.
 * Keep these out of vehicle pages until each model has a verified image.
 */
export const unsafeCarAssetPaths = new Set<string>([
  '/assets/cars/volkswagen-virtus-exclusive-250-tsi-2026.png',
  '/assets/cars/hyundai-hb20s-2024.png',
  '/assets/cars/bmw-serie-3-320i-gp-2026.png',
  '/assets/cars/chevrolet-onix-plus-2024.png',
  '/assets/cars/bmw-3-series-320i-m-sport-2026.png',
  '/assets/cars/audi-a3-sedan-20-performance-black-2026.png',
  '/assets/cars/toyota-corolla-2024.png',
  '/assets/cars/honda-city-sedan-2024.png',
  '/assets/cars/honda-civic-2024.png',
  '/assets/cars/fiat-cronos-2024.png',
  '/assets/cars/nissan-versa-16-exclusive-2026.png',
  '/assets/cars/fiat-cronos-precision-13-cvt-2026.png',
  '/assets/cars/hyundai-hb20s-platinum-plus-10t-2026.png',
  '/assets/cars/honda-civic-advanced-ehev-2026.png',
  '/assets/cars/chevrolet-onix-plus-10-turbo-premier-2026.png',
  '/assets/cars/vw-virtus-2024.png',
  '/assets/cars/nissan-versa-2024.png',
  '/assets/cars/toyota-corolla-altis-premium-hybrid-2026.png',
  '/assets/cars/nissan-sentra-exclusive-20-2026.png',
  '/assets/cars/bmw-series-3-2024.png',
  '/assets/cars/audi-a3-sedan-2024.png',
  '/assets/cars/nissan-sentra-2024.png',
  '/assets/cars/honda-city-sedan-touring-15-2026.png',
  '/assets/cars/caoa-chery-tiggo-7-pro-max-drive-16t-2026.png',
  '/assets/cars/toyota-sw4-2024.png',
  '/assets/cars/caoa-chery-tiggo-5x-sport-turbo-2026.png',
  '/assets/cars/gwm-haval-h6-hev-premium-2026.png',
  '/assets/cars/caoa-chery-tiggo-5x-2024.png',
  '/assets/cars/fiat-fastback-limited-edition-powered-by-abarth-2026.png',
  '/assets/cars/toyota-sw4-srx-platinum-28-diesel-2026.png',
  '/assets/cars/fiat-pulse-abarth-turbo-270-2026.png',
  '/assets/cars/fiat-fastback-2024.png',
  '/assets/cars/gwm-haval-h6-hev2-2026.png',
  '/assets/cars/caoa-chery-tiggo-8-pro-plug-in-hybrid-2026.png',
  '/assets/cars/gwm-haval-h6-2024.png',
  '/assets/cars/fiat-pulse-2024.png',
  '/assets/cars/cao-chery-tiggo-5x-2024.png',
  '/assets/cars/ford-ranger-2024.png',
  '/assets/cars/ford-maverick-lariat-fx4-20-turbo-2026.png',
  '/assets/cars/ford-maverick-2024.png',
  '/assets/cars/nissan-frontier-pro-4x-diesel-2026.png',
  '/assets/cars/fiat-toro-2024.png',
  '/assets/cars/chevrolet-s10-z71-28-diesel-2026.png',
  '/assets/cars/nissan-frontier-2024.png',
  '/assets/cars/chevrolet-s10-2024.png',
  '/assets/cars/toyota-hilux-2024.png',
  '/assets/cars/chevrolet-montana-12-turbo-rs-2026.png',
  '/assets/cars/chevrolet-montana-2024.png',
  '/assets/cars/honda-hrv-advance-15-turbo-2026.png',
  '/assets/cars/nissan-kicks-2024.png',
  '/assets/cars/toyota-corolla-cross-xrx-hybrid-2026.png',
  '/assets/cars/peugeot-2008-2024.png',
  '/assets/cars/volkswagen-nivus-highline-200-tsi-2026.png',
  '/assets/cars/honda-hr-v-2024.png',
  '/assets/cars/honda-hr-v-touring-turbo-2026.png',
  '/assets/cars/honda-hrv-2024.png',
  '/assets/cars/nissan-kicks-16-exclusive-cvt-2026.png',
  '/assets/cars/toyota-corolla-cross-2024.png',
  '/assets/cars/vw-nivus-2024.png',
  '/assets/cars/byd-dolphin-ev-diamond-2026.png',
  '/assets/cars/byd-dolphin-mini-2025.png',
  '/assets/cars/byd-song-plus-dm-i-plug-in-hybrid-2026.png',
  '/assets/cars/byd-dolphin-mini-ev-38kwh-2026.png',
  '/assets/cars/ford-ranger-2025.png',
  '/assets/cars/ford-ranger-limited-v6-performance-2026.png',
  '/assets/cars/ford-territory-titanium-15-turbo-2026.png',
  '/assets/cars/citroën-c3-aircross-shine-7-lugares-turbo-200-2026.png',
  '/assets/cars/citroen-c3-10-live-pack-2026.png',
  '/assets/cars/citroen-c3-2024.png',
  '/assets/cars/bmw-x1-sdrive20i-m-sport-2026.png',
  '/assets/cars/bmw-i4-2024.png',
  '/assets/cars/bmw-i4-m50-2026.png',
  '/assets/cars/mitsubishi-eclipse-cross-hpe-s-s-awc-15-turbo-2026.png',
  '/assets/cars/mini-mini-cooper-3-portas-sport-2026.png',
  '/assets/cars/mini-cooper-s-2024.png',
])

const catalogImageOverrides = new Map<string, string>([
  // Foto oficial da CAOA Chery para a linha Tiggo 5X.
  ['caoa-chery|tiggo-5x', 'https://cloudfront.alpes.one/public/690/3a6/f25/6903a6f254115278708991.png'],
])

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getCatalogCarImage(brand: string, model: string, preferredImage?: string | null): string | null {
  const brandKey = normalize(brand)
  const modelKey = normalize(model)
  const curatedImage = catalogImageOverrides.get(`${brandKey}|${modelKey}`)
  if (curatedImage) return curatedImage

  if (preferredImage && unsafeCarAssetPaths.has(preferredImage)) return null
  return preferredImage || null
}

export function isUnsafeCarAsset(path: string): boolean {
  return unsafeCarAssetPaths.has(path)
}
