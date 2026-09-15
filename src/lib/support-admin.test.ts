import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getAuthContext, getSupabaseServerClient, getUser } = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  getSupabaseServerClient: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('./auth-server', () => ({ getAuthContext }))
vi.mock('./supabase-server', () => ({ getSupabaseServerClient }))

import {
  SupportAdminAuthorizationError,
  getSupportAdminEmails,
  requireSupportAdmin,
} from './support-admin'

const originalSupportAdminEmails = process.env.SUPPORT_ADMIN_EMAILS
const originalAdminNotifyEmail = process.env.ADMIN_NOTIFY_EMAIL

describe('support admin authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSupabaseServerClient.mockReturnValue({ auth: { getUser } })
    getAuthContext.mockResolvedValue({ userId: 'admin-user', accessToken: 'valid-session' })
    process.env.SUPPORT_ADMIN_EMAILS = ' admin@carbi.com.br , SECOND@carbi.com.br '
    process.env.ADMIN_NOTIFY_EMAIL = 'fallback@carbi.com.br'
  })

  afterEach(() => {
    if (originalSupportAdminEmails === undefined) delete process.env.SUPPORT_ADMIN_EMAILS
    else process.env.SUPPORT_ADMIN_EMAILS = originalSupportAdminEmails
    if (originalAdminNotifyEmail === undefined) delete process.env.ADMIN_NOTIFY_EMAIL
    else process.env.ADMIN_NOTIFY_EMAIL = originalAdminNotifyEmail
  })

  it('normalizes the configured allowlist and falls back to the notification address', () => {
    expect(getSupportAdminEmails()).toEqual(new Set(['admin@carbi.com.br', 'second@carbi.com.br']))

    process.env.SUPPORT_ADMIN_EMAILS = ' , '
    expect(getSupportAdminEmails()).toEqual(new Set(['fallback@carbi.com.br']))
  })

  it('allows an authenticated user whose normalized email is allowlisted', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'admin-user', email: ' ADMIN@CARBI.COM.BR ' } }, error: null })

    await expect(requireSupportAdmin(new Request('https://carbi.com.br/api/admin/support', {
      headers: { authorization: 'Bearer valid-session' },
    }) as never)).resolves.toEqual({ userId: 'admin-user', email: 'admin@carbi.com.br' })
  })

  it('rejects an authenticated user whose email is not allowlisted', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'member-user', email: 'member@carbi.com.br' } }, error: null })

    await expect(requireSupportAdmin(new Request('https://carbi.com.br/api/admin/support', {
      headers: { authorization: 'Bearer valid-session' },
    }) as never)).rejects.toBeInstanceOf(SupportAdminAuthorizationError)
  })

  it('rejects missing and malformed bearer authorization before calling Supabase Auth', async () => {
    getAuthContext.mockResolvedValue(null)

    await expect(requireSupportAdmin(new Request('https://carbi.com.br/api/admin/support') as never))
      .rejects.toBeInstanceOf(SupportAdminAuthorizationError)
    await expect(requireSupportAdmin(new Request('https://carbi.com.br/api/admin/support', {
      headers: { authorization: 'Basic invalid' },
    }) as never)).rejects.toBeInstanceOf(SupportAdminAuthorizationError)

    expect(getSupabaseServerClient).not.toHaveBeenCalled()
  })
})
