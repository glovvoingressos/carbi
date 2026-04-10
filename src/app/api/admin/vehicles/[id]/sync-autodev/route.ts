import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { errorResponse, successResponse } from '@/lib/api-response'
import { syncAutoDevRequestSchema, vehicleIdParamSchema } from '@/lib/integrations/autoDev/schemas'
import { runAutoDevSync } from '@/lib/integrations/autoDev/service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json(errorResponse('Não autenticado.'), { status: 401 })
    }

    const parsedParams = vehicleIdParamSchema.safeParse(await params)
    if (!parsedParams.success) {
      return NextResponse.json(errorResponse(parsedParams.error.issues[0]?.message || 'Parâmetros inválidos.'), { status: 400 })
    }

    const bodyInput = await req.json().catch(() => ({}))
    const body = syncAutoDevRequestSchema.safeParse(bodyInput)
    if (!body.success) {
      return NextResponse.json(errorResponse(body.error.issues[0]?.message || 'Payload inválido.'), { status: 400 })
    }

    const result = await runAutoDevSync({
      vehicleId: parsedParams.data.id,
      requesterId: auth.userId,
      accessToken: auth.accessToken,
      force: body.data.force,
      vinOverride: body.data.vin || null,
    })

    if (!result.success) {
      return NextResponse.json(errorResponse(result.errors[0] || 'Falha ao sincronizar dados do veículo.', {
        status: result.status,
        errors: result.errors,
        fromCache: result.fromCache,
      }), { status: 400 })
    }

    return NextResponse.json(successResponse(result.enrichment, {
      status: result.status,
      errors: result.errors,
      fromCache: result.fromCache,
    }))
  } catch (error) {
    console.error('POST /api/admin/vehicles/[id]/sync-autodev failed', error)
    return NextResponse.json(errorResponse('Falha ao sincronizar dados da Auto.dev.'), { status: 500 })
  }
}
