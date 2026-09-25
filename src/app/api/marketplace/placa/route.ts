import { NextRequest, NextResponse } from 'next/server'
import { lookupPlate } from '@/lib/integrations/placaapi/service'
import { sanitizeVehicleStructuredData } from '@/lib/marketplace'

export async function GET(req: NextRequest) {
  const plate = req.nextUrl.searchParams.get('plate')
  if (!plate) {
    return NextResponse.json({ error: 'Placa não informada.' }, { status: 400 })
  }

  const result = await lookupPlate(plate)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const data = result.data
  return NextResponse.json({
    marca: data.marca,
    modelo: data.modelo,
    versao: data.versao,
    anoFabricacao: data.anoFabricacao,
    anoModelo: data.anoModelo,
    cor: data.cor,
    combustivel: data.combustivel,
    cilindradas: data.cilindradas,
    potencia: data.potencia,
    cambio: data.cambio,
    tipoVeiculo: data.tipoVeiculo,
    capacidadeCarga: data.capacidadeCarga,
    numeroEixos: data.numeroEixos,
    tipoCabine: data.tipoCabine,
    pbt: data.pbt,
    cmt: data.cmt,
    categoria: data.categoria,
    fipe_price: data.fipe_price,
    fipe_reference_month: data.fipe_reference_month,
    fipe_code: data.fipe_code,
    fipe_model_name: data.fipe_model_name,
    fipe_brand_name: data.fipe_brand_name,
    structured_data: sanitizeVehicleStructuredData(data.structured_data),
  })
}
