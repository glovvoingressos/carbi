import { NextRequest, NextResponse } from 'next/server'
import { getFilteredFipeYears } from '@/lib/fipe-api'

export async function GET(req: NextRequest) {
  const brandCode = req.nextUrl.searchParams.get('brandCode')
  const modelCode = req.nextUrl.searchParams.get('modelCode')
  if (!brandCode || !modelCode) return NextResponse.json([], { status: 400 })
  const years = await getFilteredFipeYears(brandCode, modelCode, 6)
  return NextResponse.json(years)
}
