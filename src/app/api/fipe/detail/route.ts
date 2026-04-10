import { NextRequest, NextResponse } from 'next/server'
import { getFipeDetailByCode, getFipeModels } from '@/lib/fipe-api'

function parseYearCode(raw: string): { modelYear?: number; fuelCode?: string } {
  const parts = raw.split('-')
  const modelYear = Number(parts[0])
  return {
    modelYear: Number.isFinite(modelYear) ? modelYear : undefined,
    fuelCode: parts[1] || undefined,
  }
}

export async function GET(req: NextRequest) {
  const brandCode = req.nextUrl.searchParams.get('brandCode')
  const modelCode = req.nextUrl.searchParams.get('modelCode')
  const yearCode = req.nextUrl.searchParams.get('yearCode')
  
  if (!brandCode || !modelCode || !yearCode) {
    return NextResponse.json({ error: 'brandCode, modelCode e yearCode são obrigatórios.' }, { status: 400 })
  }

  const models = await getFipeModels(brandCode)
  const selectedModel = models.find((model) => model.code === modelCode)
  if (!selectedModel) {
    return NextResponse.json({ error: 'Modelo inválido para a marca selecionada.' }, { status: 404 })
  }

  const result = await getFipeDetailByCode(brandCode, modelCode, yearCode)
  if (!result) {
    return NextResponse.json({ error: 'Não foi possível obter o valor para a seleção informada.' }, { status: 404 })
  }

  const { modelYear, fuelCode } = parseYearCode(yearCode)
  const modelMatches = result.model.toLowerCase().includes(selectedModel.name.toLowerCase())
  const hasPrice = typeof result.price === 'string' && result.price.trim().length > 0
  const hasCode = typeof result.codeFipe === 'string' && result.codeFipe.trim().length > 0
  const yearMatches = !modelYear || result.modelYear === modelYear
  const fuelMatches = !fuelCode || String(result.fuelAcronym || '').trim().length > 0 || String(result.fuel || '').trim().length > 0

  if (!modelMatches || !hasPrice || !hasCode || !yearMatches || !fuelMatches) {
    return NextResponse.json({ error: 'Resposta inválida da FIPE para a combinação selecionada.' }, { status: 422 })
  }

  return NextResponse.json(result)
}
