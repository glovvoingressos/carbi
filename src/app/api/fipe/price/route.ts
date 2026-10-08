import { NextRequest, NextResponse } from 'next/server'
import { getFipePrice } from '@/lib/fipe-api'

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand')?.trim() || ''
  const model = req.nextUrl.searchParams.get('model')?.trim() || ''
  const version = req.nextUrl.searchParams.get('version')?.trim() || undefined
  const year = Number(req.nextUrl.searchParams.get('year'))

  if (!brand || !model || !Number.isInteger(year) || year < 1900) {
    return NextResponse.json({ error: 'brand, model e year são obrigatórios.' }, { status: 400 })
  }

  const result = await getFipePrice(brand, model, year, version)

  if (!result?.price) {
    return NextResponse.json({ error: 'Não encontramos referência FIPE para este veículo.' }, { status: 404 })
  }

  return NextResponse.json(result)
}
