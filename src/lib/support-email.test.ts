import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { resendSend } = vi.hoisted(() => ({ resendSend: vi.fn() }))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: resendSend }
  },
}))

import { sendSupportAdminNotification } from './support-email'

const originalEnv = {
  ADMIN_NOTIFY_EMAIL: process.env.ADMIN_NOTIFY_EMAIL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
}

describe('sendSupportAdminNotification', () => {
  beforeEach(() => {
    process.env.ADMIN_NOTIFY_EMAIL = 'support-admin@carbi.com.br'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://carbi.com.br'
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.RESEND_FROM_EMAIL = 'CarDecision <support@carbi.com.br>'
    resendSend.mockResolvedValue({ data: { id: 'email-1' }, error: null })
  })

  afterEach(() => {
    vi.clearAllMocks()
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  it('sends an escaped support message with the exact subject and visitor Reply-To', async () => {
    await expect(sendSupportAdminNotification({
      conversationId: 'conversation-1',
      name: 'Ana <script>alert(1)</script>',
      email: 'ana&co@example.com',
      message: 'Preciso de <ajuda> & "resposta"',
    })).resolves.toEqual({ success: true })

    expect(resendSend).toHaveBeenCalledWith(expect.objectContaining({
      from: 'CarDecision <support@carbi.com.br>',
      to: ['support-admin@carbi.com.br'],
      replyTo: 'ana&co@example.com',
      subject: 'Nova mensagem de suporte no CarDecision',
    }))
    const payload = resendSend.mock.calls[0][0]
    expect(payload.html).toContain('Ana &lt;script&gt;alert(1)&lt;/script&gt;')
    expect(payload.html).toContain('ana&amp;co@example.com')
    expect(payload.html).toContain('Preciso de &lt;ajuda&gt; &amp; &quot;resposta&quot;')
    expect(payload.html).toContain('https://carbi.com.br/admin/suporte?conversation=conversation-1')
    expect(payload.html).not.toContain('<script>alert(1)</script>')
  })

  it('omits Reply-To when the visitor did not provide an email address', async () => {
    await sendSupportAdminNotification({ conversationId: 'conversation-1', message: 'Olá' })

    expect(resendSend).toHaveBeenCalledWith(expect.not.objectContaining({ replyTo: expect.anything() }))
  })

  it('returns a safe warning without sending when required configuration is missing', async () => {
    delete process.env.ADMIN_NOTIFY_EMAIL

    await expect(sendSupportAdminNotification({ conversationId: 'conversation-1', message: 'Olá' }))
      .resolves.toEqual({ success: false, warning: 'ADMIN_NOTIFY_EMAIL not configured' })

    expect(resendSend).not.toHaveBeenCalled()
  })

  it('returns a safe warning when Resend reports a delivery failure', async () => {
    resendSend.mockResolvedValue({ data: null, error: { message: 'Rejected' } })

    await expect(sendSupportAdminNotification({ conversationId: 'conversation-1', message: 'Olá' }))
      .resolves.toEqual({ success: false, warning: 'Support notification could not be sent' })
  })
})
