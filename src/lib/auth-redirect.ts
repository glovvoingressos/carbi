export function getAuthCode(search: string): string | null {
  return new URLSearchParams(search).get('code')
}

export const DEFAULT_AUTH_REDIRECT = '/minha-conta'

export function getSafeRedirectPath(value: string | null | undefined, fallback = DEFAULT_AUTH_REDIRECT): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}

export function buildLoginRedirect(destination: string): string {
  return `/entrar?redirect=${encodeURIComponent(getSafeRedirectPath(destination))}`
}
