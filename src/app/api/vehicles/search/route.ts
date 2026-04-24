import { NextResponse } from 'next/server'
import { getAllCars, groupCarsByModel } from '@/lib/data-fetcher'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.toLowerCase() || ''

  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const allCars = await getAllCars()
  const grouped = groupCarsByModel(allCars)

  const results = grouped
    .filter(item => {
      const b = item.representative.brand.toLowerCase()
      const m = item.representative.model.toLowerCase()
      const s = item.modelSlug.toLowerCase()
      const seg = item.representative.segment.toLowerCase()
      
      // Intent matching
      const isUberIntent = q.includes('uber') || q.includes('aplicativo') || q.includes('99')
      if (isUberIntent && (item.representative.isPopular || item.representative.fuelEconomyCityGas > 14)) return true

      return b.includes(q) || m.includes(q) || s.includes(q) || seg.includes(q)
    })
    .slice(0, 8)
    .map(item => ({
      brand: item.representative.brand,
      model: item.representative.model,
      slug: item.modelSlug,
      brandSlug: item.representative.brand.toLowerCase().replace(/\s+/g, '-'),
      image: item.representative.image,
      year: item.representative.year,
      price: item.representative.priceBrl,
    }))

  return NextResponse.json({ results })
}
