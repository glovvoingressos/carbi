import { NextResponse } from 'next/server'
import { getFipeBrands, getFipeModels, getFipeReferences } from '@/lib/fipe-api'

export async function GET() {
  const references = await getFipeReferences()
  const latest = references[0] || null
  const brands = await getFipeBrands()
  const vw = brands.find((brand) => /vw|volkswagen/i.test(brand.name))
  const models = vw ? await getFipeModels(vw.code) : []
  const hasModels = models.length > 0

  return NextResponse.json({
    provider: 'parallelum',
    latestReference: latest,
    referencesCount: references.length,
    brandsCount: brands.length,
    sampleBrand: vw?.name || null,
    sampleBrandModelsCount: models.length,
    status: latest && brands.length > 0 && hasModels ? 'ok' : 'degraded',
  })
}
