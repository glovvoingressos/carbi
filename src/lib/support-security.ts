export const VISITOR_TOKEN_COOKIE = 'carbi_support_visitor'

export const VISITOR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
}

type CookieRequest = Pick<Request, 'headers'> & {
  cookies?: {
    get(name: string): { value: string } | undefined
  }
}

export function createVisitorToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)

  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export async function hashVisitorToken(token: string): Promise<string> {
  if (!token) {
    throw new Error('Visitor token is required.')
  }

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  )

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export function getOrCreateVisitorToken(request: CookieRequest): {
  token: string
  setCookie: boolean
} {
  const cookieFromRequest = request.cookies?.get(VISITOR_TOKEN_COOKIE)?.value
    ?? readCookieHeader(request.headers.get('cookie'))

  if (cookieFromRequest) {
    return { token: cookieFromRequest, setCookie: false }
  }

  return { token: createVisitorToken(), setCookie: true }
}

function readCookieHeader(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) {
    return undefined
  }

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=')
    if (separator === -1) {
      continue
    }

    const name = part.slice(0, separator).trim()
    if (name === VISITOR_TOKEN_COOKIE) {
      const value = part.slice(separator + 1).trim()
      return value || undefined
    }
  }

  return undefined
}
