import { NextRequest, NextResponse } from 'next/server'
import { getFipeMonthlyHistory, getFipeHistory, isFipeRateLimited } from '@/lib/fipe-api'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'
import { getPrivateVehicleLookup, savePrivateVehicleFipeHistory, savePrivateVehicleFipeIdentity } from '@/lib/vehicle-private-data'
import { lookupPlate } from '@/lib/integrations/placaapi/service'
import { formatBRL } from '@/data/cars'

function historyResponse(
  history: { month: string; price: string; priceNum: number }[],
  source: 'historical' | 'current-snapshot' = 'historical',
) {
  return NextResponse.json(history, {
    headers: {
      'Cache-Control': history.length > 0 ? 'public, s-maxage=86400, stale-while-revalidate=604800' : 'no-store',
      'X-FIPE-History-Source': source,
    },
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  let brand = searchParams.get('brand')
  let model = searchParams.get('model')
  let year = searchParams.get('year')
  let version = searchParams.get('version')
  let vehicleId: string | null = null
  let savedFipeSnapshot: { month: string; price: string; priceNum: number }[] = []
  const listingId = searchParams.get('listingId')

  if (listingId && !isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Consulta de histórico indisponível no momento.' }, { status: 503 })
  }

  if (listingId) {
    const { data: listing, error } = await getSupabaseServerClient()
      .from('vehicle_listings_public')
      .select('vehicle_id, brand, model, version, year_model, fipe_price, fipe_reference_month')
      .eq('id', listingId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: 'Não foi possível localizar o anúncio.' }, { status: 500 })
    if (!listing) return NextResponse.json({ error: 'Anúncio não encontrado.' }, { status: 404 })

    vehicleId = listing.vehicle_id || null
    brand = listing.brand
    model = listing.model
    year = String(listing.year_model)
    version = listing.version || null
    const savedPrice = Number(listing.fipe_price)
    if (Number.isFinite(savedPrice) && savedPrice > 0) {
      savedFipeSnapshot = [{
        month: listing.fipe_reference_month || 'Último valor salvo',
        price: formatBRL(savedPrice),
        priceNum: savedPrice,
      }]
    }

    if (vehicleId) {
      let privateLookup: Awaited<ReturnType<typeof getPrivateVehicleLookup>>
      try {
        privateLookup = await getPrivateVehicleLookup(vehicleId)
      } catch (error) {
        console.error('[FIPE history] private lookup error:', error)
        return historyResponse(savedFipeSnapshot, 'current-snapshot')
      }
      if (privateLookup) {
        brand = privateLookup.brand || brand
        model = privateLookup.model || model
        year = String(privateLookup.year_model || year)
        version = privateLookup.fipe_model_name || privateLookup.version || version
        if (privateLookup.fipe_history?.length) return historyResponse(privateLookup.fipe_history)

        if (privateLookup.plate && !privateLookup.fipe_model_name) {
          const plateResult = await lookupPlate(privateLookup.plate)
          if (plateResult.success && plateResult.data) {
            brand = plateResult.data.marca || brand
            model = plateResult.data.modelo || model
            year = String(plateResult.data.anoModelo || privateLookup.year_model || year)
            version = plateResult.data.fipe_model_name || plateResult.data.versao || version
            await savePrivateVehicleFipeIdentity(vehicleId, {
              brand: plateResult.data.marca,
              model: plateResult.data.modelo,
              year_model: plateResult.data.anoModelo || privateLookup.year_model,
              fipe_model_name: plateResult.data.fipe_model_name,
              fipe_code: plateResult.data.fipe_code,
            })
          }
        }
      }
    }
  }

  if (!brand || !model || !year) {
    return NextResponse.json({ error: 'brand, model e year são obrigatórios' }, { status: 400 })
  }

  const yearNum = parseInt(year, 10)
  if (isNaN(yearNum)) {
    return NextResponse.json({ error: 'year deve ser um número' }, { status: 400 })
  }

  const baseModel = model.split(' ')[0]

  try {
    const monthly = await getFipeMonthlyHistory(brand, baseModel, yearNum, version || undefined, 2)
    if (monthly.length >= 2 || isFipeRateLimited()) {
      if (vehicleId && monthly.length >= 2) await savePrivateVehicleFipeHistory(vehicleId, monthly)
      return monthly.length > 0
        ? historyResponse(monthly)
        : historyResponse(savedFipeSnapshot, 'current-snapshot')
    }

    const yearly = await getFipeHistory(brand, baseModel, 6, version || undefined)
    const history = yearly.map(d => ({ month: String(d.year), price: d.price, priceNum: d.priceNum }))
    if (vehicleId && history.length >= 2) await savePrivateVehicleFipeHistory(vehicleId, history)
    return history.length > 0 ? historyResponse(history) : historyResponse(savedFipeSnapshot, 'current-snapshot')
  } catch (error) {
    console.error('[FIPE history] error:', error)
    return historyResponse(savedFipeSnapshot, 'current-snapshot')
  }
}
