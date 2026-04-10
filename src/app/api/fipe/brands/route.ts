import { NextResponse } from 'next/server'
import { getFipeBrands } from '@/lib/fipe-api'

export async function GET() {
  const brands = await getFipeBrands()
  if (!Array.isArray(brands) || brands.length === 0) {
    return NextResponse.json({ error: 'Falha ao carregar marcas na origem FIPE.' }, { status: 502 })
  }
  return NextResponse.json(brands)
}
