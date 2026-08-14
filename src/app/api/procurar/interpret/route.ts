import { NextRequest, NextResponse } from 'next/server'
import { interpretQuery } from '@/lib/buyer-agent/interpret'
import { interpretWithLLM } from '@/lib/buyer-agent/llm'
import { getVocabulary } from '@/lib/buyer-agent/vocabulary'
import { criteriaLines } from '@/lib/buyer-agent/explain'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { query?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const query = (body?.query || '').trim()
  if (!query) {
    return NextResponse.json({ error: 'Informe o que você procura.' }, { status: 400 })
  }
  if (query.length > 500) {
    return NextResponse.json({ error: 'Descrição muito longa.' }, { status: 400 })
  }

  const vocabulary = await getVocabulary()
  const result = await interpretQuery(query, vocabulary, {
    onLLM: (q, v) => interpretWithLLM(q, v),
  })

  return NextResponse.json({
    query: result.query,
    source: result.source,
    criteria: result.criteria,
    lines: criteriaLines(result.criteria),
    needsFollowUp: result.needsFollowUp,
    followUpQuestion: result.followUpQuestion,
    ambiguous: result.ambiguous,
  })
}