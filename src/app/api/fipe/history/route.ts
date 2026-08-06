import { NextRequest, NextResponse } from 'next/server'
import { getFipeMonthlyHistory, getFipeHistory } from '@/lib/fipe-api'

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

  const versionStr = version || undefined
  const monthsCount = months ? parseInt(months, 10) : 5

  console.log('[FIPE history]', { brand, model, year: yearNum, version: versionStr })

  try {
    const monthly = await getFipeMonthlyHistory(brand, model, yearNum, versionStr, monthsCount)
    console.log('[FIPE history] monthly result count:', monthly.length)

    if (monthly.length >= 2) {
      return NextResponse.json(monthly)
    }

    console.log('[FIPE history] falling back to yearly history')
    const yearly = await getFipeHistory(brand, model, 6, versionStr)
    console.log('[FIPE history] yearly result count:', yearly.length)

    if (yearly.length > 0) {
      return NextResponse.json(yearly.map(d => ({ month: String(d.year), price: d.price, priceNum: d.priceNum })))
    }

    console.log('[FIPE history] no data found')
    return NextResponse.json([])
  } catch (error) {
    console.error('[FIPE history] error:', error)
    try {
      const yearly = await getFipeHistory(brand, model, 6, versionStr)
      return NextResponse.json(yearly.map(d => ({ month: String(d.year), price: d.price, priceNum: d.priceNum })))
    } catch (fallbackError) {
      console.error('[FIPE history] fallback error:', fallbackError)
      return NextResponse.json({ error: 'Erro ao buscar histórico FIPE' }, { status: 500 })
    }
  }
}