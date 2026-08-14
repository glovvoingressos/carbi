import { NextRequest, NextResponse } from 'next/server'
import { runBuyerMatchScan } from '@/lib/buyer-agent/scan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') || ''
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const windowMinutes = Number(url.searchParams.get('window') || 25)
    const limitListings = Number(url.searchParams.get('limit') || 50)

    const result = await runBuyerMatchScan({ windowMinutes, limitListings })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('scan route error:', error)
    return NextResponse.json({ ok: false, error: 'Falha ao executar scan.' }, { status: 500 })
  }
}