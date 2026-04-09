import { NextRequest, NextResponse } from 'next/server'
import { getFipeDetailByCode } from '@/lib/fipe-api'

export async function GET(req: NextRequest) {
  const brandCode = req.nextUrl.searchParams.get('brandCode')
  const modelCode = req.nextUrl.searchParams.get('modelCode')
  const yearCode = req.nextUrl.searchParams.get('yearCode')
  
  if (!brandCode || !modelCode || !yearCode) return NextResponse.json(null, { status: 400 })
  const result = await getFipeDetailByCode(brandCode, modelCode, yearCode)
  return NextResponse.json(result)
}
