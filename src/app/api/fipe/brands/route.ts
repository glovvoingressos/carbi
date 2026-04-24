import { NextRequest, NextResponse } from 'next/server'
import { getFipeBrands } from '@/lib/fipe-api'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'cars'
  const brands = await getFipeBrands(type)
  if (!Array.isArray(brands) || brands.length === 0) {
    return NextResponse.json({ error: `Falha ao carregar marcas (${type}) na origem FIPE.` }, { status: 502 })
  }
  return NextResponse.json(brands)
}
