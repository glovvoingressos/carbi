import { NextResponse } from 'next/server'
import { getAllCars } from '@/lib/data-fetcher'

export async function GET() {
  try {
    const cars = await getAllCars()
    return NextResponse.json(cars)
  } catch (error) {
    console.error('GET /api/cars failed', error)
    return NextResponse.json({ error: 'Falha ao carregar catálogo.' }, { status: 500 })
  }
}
