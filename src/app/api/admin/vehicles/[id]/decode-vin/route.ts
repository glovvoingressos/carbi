import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { errorResponse, successResponse } from '@/lib/api-response'
import { decodeVinRequestSchema, vehicleIdParamSchema } from '@/lib/integrations/autoDev/schemas'
import { decodeVinForPreview } from '@/lib/integrations/autoDev/service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(errorResponse('Supabase não configurado.'), { status: 503 })
    }

    const auth = await getAuthContext(req)
    if (!auth) {
      return NextResponse.json(errorResponse('Não autenticado.'), { status: 401 })
    }

    const parsedParams = vehicleIdParamSchema.safeParse(await params)
    if (!parsedParams.success) {
      return NextResponse.json(errorResponse(parsedParams.error.issues[0]?.message || 'Parâmetros inválidos.'), { status: 400 })
    }

    const bodyInput = await req.json().catch(() => ({}))
    const body = decodeVinRequestSchema.safeParse(bodyInput)
    if (!body.success) {
      return NextResponse.json(errorResponse(body.error.issues[0]?.message || 'VIN inválido.'), { status: 400 })
    }

    const supabase = getSupabaseServerClient(auth.accessToken)
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, owner_user_id')
      .eq('id', parsedParams.data.id)
      .maybeSingle()

    if (vehicleError || !vehicle) {
      return NextResponse.json(errorResponse('Veículo não encontrado.'), { status: 404 })
    }

    if (vehicle.owner_user_id !== auth.userId) {
      return NextResponse.json(errorResponse('Sem permissão para este veículo.'), { status: 403 })
    }

    const preview = await decodeVinForPreview(body.data.vin)
    if (!preview.success) {
      return NextResponse.json(errorResponse(preview.error || 'Falha ao decodificar VIN.'), { status: 400 })
    }

    await supabase.from('vehicles').update({ vin: body.data.vin }).eq('id', parsedParams.data.id)

    return NextResponse.json(successResponse(preview.data, {
      vin: body.data.vin,
      prefillSuggested: true,
    }))
  } catch (error) {
    console.error('POST /api/admin/vehicles/[id]/decode-vin failed', error)
    return NextResponse.json(errorResponse('Falha ao decodificar VIN.'), { status: 500 })
  }
}
