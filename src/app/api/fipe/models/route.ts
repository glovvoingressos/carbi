import { NextRequest, NextResponse } from 'next/server'
import { getFipeModels } from '@/lib/fipe-api'

export async function GET(req: NextRequest) {
  const brandCode = req.nextUrl.searchParams.get('brandCode')
  const type = req.nextUrl.searchParams.get('type') || 'cars'
  
  if (!brandCode) {
    return NextResponse.json({ error: 'brandCode é obrigatório.' }, { status: 400 })
  }
  
  const models = await getFipeModels(brandCode, type)
  if (!Array.isArray(models)) {
    return NextResponse.json({ error: 'Resposta inválida de modelos.' }, { status: 502 })
  }
  return NextResponse.json(models)
}
