import { NextRequest, NextResponse } from 'next/server'
import { getFipeModels } from '@/lib/fipe-api'

export async function GET(req: NextRequest) {
  const brandCode = req.nextUrl.searchParams.get('brandCode')
  if (!brandCode) return NextResponse.json([], { status: 400 })
  const models = await getFipeModels(brandCode)
  return NextResponse.json(models)
}
