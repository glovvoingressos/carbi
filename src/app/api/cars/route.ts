import { NextResponse } from 'next/server'
import { getAllCars, groupCarsByModel } from '@/lib/data-fetcher'

export async function GET(request: Request) {
  try {
    const cars = await getAllCars()
    const { searchParams } = new URL(request.url)
    const includeVersions = searchParams.get('versions') === '1'
    if (includeVersions) {
      return NextResponse.json(cars)
    }
    const grouped = groupCarsByModel(cars).map((item) => item.representative)
    return NextResponse.json(grouped)
  } catch (error) {
    console.error('GET /api/cars failed', error)
    return NextResponse.json({ error: 'Falha ao carregar catálogo.' }, { status: 500 })
  }
}
