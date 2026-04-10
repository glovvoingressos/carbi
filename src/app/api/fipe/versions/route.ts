import { NextRequest, NextResponse } from 'next/server'
import { getFipeVersionsByYear } from '@/lib/fipe-api'

export async function GET(req: NextRequest) {
  const brandCode = req.nextUrl.searchParams.get('brandCode')
  const modelCode = req.nextUrl.searchParams.get('modelCode')
  const year = parseInt(req.nextUrl.searchParams.get('year') || '', 10)

  if (!brandCode || !modelCode || Number.isNaN(year)) {
    return NextResponse.json([], { status: 400 })
  }

  const versions = await getFipeVersionsByYear(brandCode, modelCode, year)
  return NextResponse.json(versions)
}
