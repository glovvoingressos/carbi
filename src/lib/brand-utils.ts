export function normalizeBrandKey(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function slugifyBrand(input: string): string {
  return normalizeBrandKey(input).replace(/\s+/g, '-')
}

export function pickPreferredBrandName(current: string, next: string): string {
  const hasDiacritics = (value: string) => /[\u00C0-\u017F]/.test(value)
  if (hasDiacritics(next) && !hasDiacritics(current)) return next
  return current
}
