import { NextResponse } from 'next/server'
import { getFipeBrands } from '@/lib/fipe-api'

export async function GET() {
  const brands = await getFipeBrands()
  return NextResponse.json(brands)
}
