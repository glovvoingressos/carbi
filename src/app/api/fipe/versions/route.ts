import { NextRequest, NextResponse } from 'next/server'
import { getFipeVersionsByYear } from '@/lib/fipe-api'

export async function GET(req: NextRequest) {
  const brandCode = req.nextUrl.searchParams.get('brandCode')
  const modelCode = req.nextUrl.searchParams.get('modelCode')
  const year = parseInt(req.nextUrl.searchParams.get('year') || '', 10)

  if (!brandCode || !modelCode || Number.isNaN(year)) {
    return NextResponse.json({ error: 'brandCode, modelCode e year são obrigatórios.' }, { status: 400 })
  }

  const versions = await getFipeVersionsByYear(brandCode, modelCode, year)
  if (!Array.isArray(versions)) {
    return NextResponse.json({ error: 'Resposta inválida de versões.' }, { status: 502 })
  }
  if (versions.length === 0) {
    return NextResponse.json({ error: 'Sem versões/combustível para o ano selecionado.' }, { status: 404 })
  }
  return NextResponse.json(versions)
}
