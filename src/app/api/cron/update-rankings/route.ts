import { NextResponse } from 'next/server'
import { getSupabaseServerClient, isSupabaseConfigured } from '../../../../lib/supabase-server'
import { JULY_2026_NEW_RANKINGS, JULY_2026_USED_RANKINGS } from '../../../../data/rankings-july-2026'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secretParam = searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET || 'test-cron-secret'

  if (secretParam !== expectedSecret && request.headers.get('authorization') !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  let updatedCount = 0
  let databaseSynced = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient()
      const recordsToInsert = [
        ...JULY_2026_NEW_RANKINGS.map((item) => ({
          period_slug: 'julho-2026',
          period_month: 7,
          period_year: 2026,
          market_type: 'new',
          rank_position: item.position,
          brand: item.brand,
          model: item.model,
          units_sold: item.unitsSold,
          fipe_avg_price: item.startingPriceBrl,
          market_share_percent: item.marketSharePercentage,
        })),
        ...JULY_2026_USED_RANKINGS.map((item) => ({
          period_slug: 'julho-2026',
          period_month: 7,
          period_year: 2026,
          market_type: 'used',
          rank_position: item.position,
          brand: item.brand,
          model: item.model,
          units_sold: item.unitsSold,
          fipe_avg_price: item.fipeAvgPriceBrl || item.startingPriceBrl,
          market_share_percent: item.marketSharePercentage,
        })),
      ]

      const { error } = await supabase
        .from('monthly_car_rankings')
        .upsert(recordsToInsert, { onConflict: 'period_slug,market_type,rank_position' })

      if (!error) {
        databaseSynced = true
        updatedCount = recordsToInsert.length
      } else {
        console.warn('Supabase monthly_car_rankings upsert error, fallback active:', error.message)
      }
    } catch (e) {
      console.warn('Supabase rankings update skipped:', e)
    }
  }

  return NextResponse.json({
    status: 'ok',
    period: 'julho-2026',
    databaseSynced,
    updatedRecords: updatedCount || (JULY_2026_NEW_RANKINGS.length + JULY_2026_USED_RANKINGS.length),
    timestamp: new Date().toISOString(),
  })
}
