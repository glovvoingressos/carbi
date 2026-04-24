import { NextRequest, NextResponse } from 'next/server'
import { getFipeDetailByCode } from '@/lib/fipe-api'

export async function GET(req: NextRequest) {
  const brandCode = req.nextUrl.searchParams.get('brandCode')
  const modelCode = req.nextUrl.searchParams.get('modelCode')
  const yearCode = req.nextUrl.searchParams.get('yearCode')
  const type = req.nextUrl.searchParams.get('type') || 'cars'
  
  if (!brandCode || !modelCode || !yearCode) {
    return NextResponse.json({ error: 'brandCode, modelCode e yearCode são obrigatórios.' }, { status: 400 })
  }

  const result = await getFipeDetailByCode(brandCode, modelCode, yearCode, type)
  
  if (!result) {
    return NextResponse.json({ error: 'Não foi possível obter o valor para a seleção informada.' }, { status: 404 })
  }

  const hasPrice = typeof result.price === 'string' && result.price.trim().length > 0
  const hasCode = typeof result.codeFipe === 'string' && result.codeFipe.trim().length > 0

  if (!hasPrice || !hasCode) {
    return NextResponse.json({ error: 'Resposta incompleta da FIPE para a combinação selecionada.' }, { status: 422 })
  }

  return NextResponse.json(result)
}
