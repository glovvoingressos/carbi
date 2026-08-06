export async function lookupPlateClient(plate: string) {
  const res = await fetch(`/api/marketplace/placa?plate=${encodeURIComponent(plate)}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao consultar placa')
  }
  return res.json()
}

import type { PlacaApiResponse } from './types'

export const PLATE_CACHE_KEY = 'carbi_plate_lookup_v1'

export function savePlateLookup(data: PlacaApiResponse): void {
  try {
    sessionStorage.setItem(PLATE_CACHE_KEY, JSON.stringify(data))
  } catch {
    // sessionStorage unavailable (SSR/privacy mode) — ignore
  }
}

export function readPlateLookup(): PlacaApiResponse | null {
  try {
    const raw = sessionStorage.getItem(PLATE_CACHE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(PLATE_CACHE_KEY)
    return JSON.parse(raw) as PlacaApiResponse
  } catch {
    return null
  }
}
