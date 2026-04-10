import { NextResponse } from 'next/server'
import { getFipeReferences } from '@/lib/fipe-api'

export async function GET() {
  const references = await getFipeReferences()
  const latest = references[0] || null

  return NextResponse.json({
    provider: 'parallelum',
    latestReference: latest,
    referencesCount: references.length,
    status: latest ? 'ok' : 'degraded',
  })
}
