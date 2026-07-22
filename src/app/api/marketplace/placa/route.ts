import { NextRequest, NextResponse } from 'next/server'
import { lookupPlate } from '@/lib/integrations/placaapi/service'

export async function GET(req: NextRequest) {
  const plate = req.nextUrl.searchParams.get('plate')
  if (!plate) {
    return NextResponse.json({ error: 'Placa não informada.' }, { status: 400 })
  }

  const result = await lookupPlate(plate)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result.data)
}
