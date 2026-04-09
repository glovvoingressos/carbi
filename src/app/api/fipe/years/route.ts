import { NextRequest, NextResponse } from 'next/server'
import { getFipeYears } from '@/lib/fipe-api'

export async function GET(req: NextRequest) {
  const brandCode = req.nextUrl.searchParams.get('brandCode')
  const modelCode = req.nextUrl.searchParams.get('modelCode')
  if (!brandCode || !modelCode) return NextResponse.json([], { status: 400 })
  const years = await getFipeYears(brandCode, modelCode)
  return NextResponse.json(years)
}
