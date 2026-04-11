import { NextResponse } from 'next/server'
import { getMarketplaceDiscoverySections } from '@/lib/marketplace-server'

export async function GET() {
  try {
    const sections = await getMarketplaceDiscoverySections()
    return NextResponse.json({
      success: true,
      data: sections,
      error: null,
      meta: {
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('GET /api/marketplace/discovery failed', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Falha ao carregar descoberta de anúncios.',
        meta: { generatedAt: new Date().toISOString() },
      },
      { status: 500 },
    )
  }
}
