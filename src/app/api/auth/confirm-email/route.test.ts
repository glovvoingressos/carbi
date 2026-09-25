import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { resendSend, getSupabaseAdminClient } = vi.hoisted(() => ({
  resendSend: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: resendSend }
  },
}))

vi.mock('@/lib/supabase-server', () => ({ getSupabaseAdminClient }))

const originalEnv = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
}

describe('POST /api/auth/confirm-email', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://carbi.com.br'
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.RESEND_FROM_EMAIL = 'Carbi <noreply@carbi.com.br>'
    getSupabaseAdminClient.mockReturnValue({
      auth: {
        admin: {
          generateLink: vi.fn().mockResolvedValue({
            data: { properties: { action_link: 'https://carbi.com.br/auth/callback?token=123' } },
            error: null,
          }),
        },
      },
    })
    resendSend.mockResolvedValue({ data: { id: 'email-1' }, error: null })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  it('uses Carbi in the confirmation email template', async () => {
    const { POST } = await import('./route')
    const response = await POST(new Request('https://carbi.com.br/api/auth/confirm-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: 'user-1', email: 'ana@example.com', name: 'Ana' }),
    }) as never)

    expect(response.status).toBe(200)
    expect(resendSend).toHaveBeenCalledTimes(1)
    const payload = resendSend.mock.calls[0][0]
    expect(payload.from).toBe('Carbi <noreply@carbi.com.br>')
    expect(payload.subject).toContain('Carbi')
    expect(payload.html).toContain('Carbi')
    expect(payload.html).not.toContain('CarDecision')
  })
})
