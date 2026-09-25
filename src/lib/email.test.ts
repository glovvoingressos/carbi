import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { resendSend } = vi.hoisted(() => ({ resendSend: vi.fn() }))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: resendSend }
  },
}))

const originalEnv = {
  ADMIN_NOTIFY_EMAIL: process.env.ADMIN_NOTIFY_EMAIL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
}

describe('transactional email templates', () => {
  beforeEach(() => {
    process.env.ADMIN_NOTIFY_EMAIL = 'admin@carbi.com.br'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://carbi.com.br'
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.RESEND_FROM_EMAIL = 'Carbi <support@carbi.com.br>'
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

  it('uses Carbi in every email template sent to users or admins', async () => {
    const email = await import('./email')
    const calls = [
      () => email.sendNewMessageEmail({
        recipientEmail: 'recipient@example.com',
        recipientName: 'Ana',
        senderName: 'Bruno',
        vehicleTitle: 'Fiat Argo',
        messageContent: 'Olá',
        conversationId: 'conversation-1',
      }),
      () => email.sendNewOfferEmail({
        sellerEmail: 'seller@example.com',
        sellerName: 'Ana',
        buyerName: 'Bruno',
        vehicleTitle: 'Fiat Argo',
        offerAmount: 50000,
        paymentMethod: 'À vista',
        offerId: 'offer-1',
      }),
      () => email.sendOfferStatusUpdateEmail({
        recipientEmail: 'recipient@example.com',
        recipientName: 'Ana',
        senderName: 'Bruno',
        vehicleTitle: 'Fiat Argo',
        status: 'accepted',
        originalAmount: 50000,
        offerId: 'offer-1',
      }),
      () => email.sendListingCreatedEmail({
        userEmail: 'seller@example.com',
        userName: 'Ana',
        vehicleTitle: 'Fiat Argo',
        price: 50000,
        listingSlug: 'fiat-argo',
      }),
      () => email.sendAdminNewListingEmail({
        vehicleTitle: 'Fiat Argo',
        brand: 'Fiat',
        model: 'Argo',
        year: 2024,
        yearModel: 2024,
        price: 50000,
        city: 'Belo Horizonte',
        state: 'MG',
        sellerName: 'Ana',
        listingSlug: 'fiat-argo',
      }),
      () => email.sendListingDeletedEmail({
        userEmail: 'seller@example.com',
        userName: 'Ana',
        vehicleTitle: 'Fiat Argo',
      }),
      () => email.sendListingStatusChangedEmail({
        userEmail: 'seller@example.com',
        userName: 'Ana',
        vehicleTitle: 'Fiat Argo',
        newStatus: 'active',
        listingSlug: 'fiat-argo',
      }),
      () => email.sendWelcomeEmail({
        userEmail: 'seller@example.com',
        userName: 'Ana',
      }),
    ]

    for (const sendEmail of calls) {
      await expect(sendEmail()).resolves.toMatchObject({ success: true })
    }

    expect(resendSend).toHaveBeenCalledTimes(calls.length)
    for (const [payload] of resendSend.mock.calls) {
      expect(payload.from).toBe('Carbi <support@carbi.com.br>')
      expect(payload.html).toContain('Carbi')
      expect(payload.html).not.toContain('CarDecision')
    }
  })
})
