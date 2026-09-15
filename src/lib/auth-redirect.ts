export function getAuthCode(search: string): string | null {
  return new URLSearchParams(search).get('code')
}
