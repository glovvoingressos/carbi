import { NextRequest, NextResponse } from 'next/server'
import { getFipeHistory } from '@/lib/fipe-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get('brand')
  const model = searchParams.get('model')
  const year = searchParams.get('year')
  const version = searchParams.get('version')

  if (!brand || !model || !year) {
    return NextResponse.json({ error: 'brand, model e year são obrigatórios' }, { status: 400 })
  }

  const yearNum = parseInt(year, 10)
  if (isNaN(yearNum)) {
    return NextResponse.json({ error: 'year deve ser um número' }, { status: 400 })
  }

  try {
    const baseModel = model.split(' ')[0]
    const yearly = await getFipeHistory(brand, baseModel, 6, version || undefined)
    return NextResponse.json(yearly.map(d => ({ month: String(d.year), price: d.price, priceNum: d.priceNum })))
  } catch (error) {
    console.error('[FIPE history] error:', error)
    return NextResponse.json([])
  }
}