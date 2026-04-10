import { NextResponse } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import { vehicleIdParamSchema } from '@/lib/integrations/autoDev/schemas'
import { getCachedVehicleEnrichment } from '@/lib/integrations/autoDev/service'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const parsed = vehicleIdParamSchema.safeParse(await params)
    if (!parsed.success) {
      return NextResponse.json(errorResponse(parsed.error.issues[0]?.message || 'Parâmetros inválidos.'), { status: 400 })
    }

    const cached = await getCachedVehicleEnrichment(parsed.data.id)

    return NextResponse.json(
      successResponse(cached.enrichment, {
        stale: cached.stale,
        fetchStatus: cached.fetchStatus,
      }),
      { status: 200 },
    )
  } catch (error) {
    console.error('GET /api/vehicles/[id]/enrichment failed', error)
    return NextResponse.json(errorResponse('Falha ao buscar dados enriquecidos do veículo.'), { status: 500 })
  }
}
