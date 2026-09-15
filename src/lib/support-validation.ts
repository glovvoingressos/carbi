export type SupportMessageInput = {
  name?: unknown
  email?: unknown
  message?: unknown
  honeypot?: unknown
}

export type ValidSupportMessage = {
  name?: string
  email?: string
  message: string
}

export type SupportMessageValidation =
  | { ok: true; value: ValidSupportMessage }
  | { ok: false; error: string }

const MAX_MESSAGE_LENGTH = 2_000
const MAX_NAME_LENGTH = 120
const MAX_EMAIL_LENGTH = 254

export function normalizeSupportText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function isValidSupportEmail(email: string): boolean {
  return (
    email.length <= MAX_EMAIL_LENGTH &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
}

export function validateSupportMessage(
  input: SupportMessageInput,
): SupportMessageValidation {
  const rawHoneypot = input.honeypot
  const honeypot = typeof rawHoneypot === 'string'
    ? normalizeSupportText(rawHoneypot)
    : rawHoneypot

  if (honeypot !== undefined && honeypot !== null && honeypot !== '') {
    return { ok: false, error: 'Invalid support message.' }
  }

  const message = typeof input.message === 'string'
    ? normalizeSupportText(input.message)
    : ''

  if (!message) {
    return { ok: false, error: 'Message is required.' }
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: 'Message must be 2,000 characters or fewer.' }
  }

  const name = typeof input.name === 'string'
    ? normalizeSupportText(input.name)
    : ''

  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: 'Name must be 120 characters or fewer.' }
  }

  const email = typeof input.email === 'string'
    ? normalizeSupportText(input.email)
    : ''

  if (email && !isValidSupportEmail(email)) {
    return { ok: false, error: 'Email must be valid.' }
  }

  return {
    ok: true,
    value: {
      name: name || undefined,
      email: email || undefined,
      message,
    },
  }
}
