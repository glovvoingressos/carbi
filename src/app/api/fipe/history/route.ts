import { NextRequest, NextResponse } from 'next/server'
import { getFipeMonthlyHistory } from '@/lib/fipe-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get('brand')
  const model = searchParams.get('model')
  const year = searchParams.get('year')
  const version = searchParams.get('version')
  const months = searchParams.get('months')

  if (!brand || !model || !year) {
    return NextResponse.json({ error: 'brand, model e year são obrigatórios' }, { status: 400 })
  }

  const yearNum = parseInt(year, 10)
  if (isNaN(yearNum)) {
    return NextResponse.json({ error: 'year deve ser um número' }, { status: 400 })
  }

  try {
    const result = await getFipeMonthlyHistory(
      brand,
      model,
      yearNum,
      version || undefined,
      months ? parseInt(months, 10) : 5,
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error('FIPE history error:', error)
    return NextResponse.json({ error: 'Erro ao buscar histórico FIPE' }, { status: 500 })
  }
}