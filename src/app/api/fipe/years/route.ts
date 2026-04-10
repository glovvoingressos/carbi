import { NextRequest, NextResponse } from 'next/server'
import { getFilteredFipeYears } from '@/lib/fipe-api'

export async function GET(req: NextRequest) {
  const brandCode = req.nextUrl.searchParams.get('brandCode')
  const modelCode = req.nextUrl.searchParams.get('modelCode')
  if (!brandCode || !modelCode) {
    return NextResponse.json({ error: 'brandCode e modelCode são obrigatórios.' }, { status: 400 })
  }
  const years = await getFilteredFipeYears(brandCode, modelCode, 6)
  if (!Array.isArray(years)) {
    return NextResponse.json({ error: 'Resposta inválida de anos.' }, { status: 502 })
  }
  const normalized = [...new Set(years)].sort((a, b) => b - a).slice(0, 6)
  if (normalized.some((year) => !Number.isFinite(year))) {
    return NextResponse.json({ error: 'Anos inválidos retornados pela origem.' }, { status: 502 })
  }
  if (normalized.length === 0) {
    return NextResponse.json({ error: 'Modelo sem anos válidos na referência atual.' }, { status: 404 })
  }
  return NextResponse.json(normalized)
}
