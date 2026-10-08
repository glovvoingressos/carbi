/**
 * Filtro de cidade tolerante a acento e a curingas.
 *
 * A coluna `city` é texto livre digitado pelo anunciante e, no mesmo banco,
 * convivem grafias diferentes do mesmo lugar:
 *
 *   "Sao Paulo" (sem acento), "Brasília" (com acento), "NOVO HAMBURGO",
 *   "Campinas - Barão Geraldo".
 *
 * Dois problemas concretos que este módulo resolve:
 *
 * 1. `ilike` ignora caixa, mas **não** ignora acento. Só `%São Paulo%` não
 *    encontra "Sao Paulo"; só `%Brasilia%` não encontra "Brasília". As duas
 *    grafias entram num OR.
 * 2. O client envia `city` como array (o campo da UI é um `string[]`), e o
 *    ramo em array usava `.in()` — igualdade exata — o que fazia as páginas
 *    `/carros/cidade-*` (que passam `%São Paulo%`) voltarem lista vazia.
 */

const stripAccents = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/**
 * Remove os caracteres com significado especial na sintaxe de `or=` do
 * PostgREST. Um `,` ou `(` no nome da cidade quebraria a leitura da cláusula
 * inteira — melhor approximar a cidade do que falhar a query.
 */
function sanitize(value: string) {
  return value.replace(/[",'()]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Um valor vira até dois padrões `ilike`: o original e a versão sem acento.
 * Presets passam o padrão já com `%`; texto digitado na UI é envolvido aqui.
 */
export function cityPatternVariants(value: string): string[] {
  const clean = sanitize(value)
  if (!clean) return []
  const pattern = clean.includes('%') ? clean : `%${clean}%`
  return [...new Set([pattern, stripAccents(pattern)])]
}

/**
 * Aplica o filtro de cidade em qualquer query builder do PostgREST.
 *
 * Vários valores (seleção múltipla) e as duas grafias de cada um viram um
 * único `.or()`; como `postgrest-js` usa `append` e não `set`, chamadas
 * encadeadas de `.or()` são combinadas com AND pelo PostgREST, então não há
 * conflito com a busca textual livre.
 */
export function applyCityFilter<T>(query: T, city?: string | string[] | null): T {
  if (!city) return query

  const values = Array.isArray(city) ? city : [city]
  const patterns = values.flatMap(cityPatternVariants)
  if (patterns.length === 0) return query

  const builder = query as any
  if (patterns.length === 1) return builder.ilike('city', patterns[0])

  return builder.or(patterns.map((pattern) => `city.ilike.${pattern}`).join(','))
}
