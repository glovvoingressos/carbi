import { runFipeRefreshBatch } from '@/lib/fipe-refresh-worker'

export const dynamic = 'force-dynamic'

const DEFAULT_BATCH_SIZE = 25
const MAX_BATCH_SIZE = 100

function parseBatchSize(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) return DEFAULT_BATCH_SIZE
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1) return DEFAULT_BATCH_SIZE
  return Math.min(parsed, MAX_BATCH_SIZE)
}

function hasRequiredConfiguration(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
      && (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SERVICE_KEY?.trim())
      && process.env.PLACA_API_TOKEN?.trim(),
  )
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return Response.json({ error: 'Agendamento não configurado.' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  if (!hasRequiredConfiguration()) {
    return Response.json({ error: 'Serviço de atualização não configurado.' }, { status: 503 })
  }

  try {
    const result = await runFipeRefreshBatch({ limit: parseBatchSize(process.env.FIPE_REFRESH_BATCH_SIZE), now: new Date() })
    return Response.json(result)
  } catch {
    return Response.json({ error: 'Falha ao atualizar valores FIPE.' }, { status: 500 })
  }
}
