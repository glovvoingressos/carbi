export type FipeReferenceMonth = { year: number; month: number; key: string }
export type FipeReferenceComparison = 'newer' | 'same' | 'older' | 'unknown'
export type FipeRetryFailureKind = 'not-updated' | 'provider-error' | 'rate-limited'

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

const RETRY_DAYS: Record<FipeRetryFailureKind, readonly number[]> = {
  'not-updated': [2, 4, 7, 10],
  'provider-error': [1, 2, 4, 7],
  'rate-limited': [3, 5, 7, 10],
}

export function parseFipeReferenceMonth(value: string | null | undefined): FipeReferenceMonth | null {
  if (typeof value !== 'string') return null

  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/\s+/g, ' ')
  const numeric = /^(\d{2})\s*\/\s*(\d{4})$/.exec(normalized)
  const iso = /^(\d{4})\s*-\s*(\d{2})$/.exec(normalized)
  const named = /^([a-z]+)\s*(?:\/| de )\s*(\d{4})$/.exec(normalized)

  const year = Number(numeric?.[2] ?? iso?.[1] ?? named?.[2])
  const month = numeric ? Number(numeric[1]) : iso ? Number(iso[2]) : MONTH_NAMES.indexOf(named?.[1] ?? '') + 1
  if (!year || month < 1 || month > 12) return null

  return { year, month, key: `${year.toString().padStart(4, '0')}-${String(month).padStart(2, '0')}` }
}

export function compareFipeReferences(
  next: string | null | undefined,
  current: string | null | undefined,
): FipeReferenceComparison {
  const nextMonth = parseFipeReferenceMonth(next)
  const currentMonth = parseFipeReferenceMonth(current)
  if (!nextMonth || !currentMonth) return 'unknown'
  if (nextMonth.key === currentMonth.key) return 'same'
  return nextMonth.key > currentMonth.key ? 'newer' : 'older'
}

export function getFipeRetryAt(
  now: Date,
  attemptsThisMonth: number,
  failureKind: FipeRetryFailureKind,
): Date {
  const firstOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 10))
  const attempts = Number.isFinite(attemptsThisMonth) ? Math.max(1, Math.floor(attemptsThisMonth)) : 1
  if (attempts >= 5) return firstOfNextMonth

  const retry = new Date(now.getTime() + RETRY_DAYS[failureKind][attempts - 1] * 24 * 60 * 60 * 1000)
  return retry < firstOfNextMonth ? retry : firstOfNextMonth
}
