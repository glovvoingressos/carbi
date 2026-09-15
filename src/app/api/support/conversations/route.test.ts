import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createConversationMessage, listVisitorConversation } = vi.hoisted(() => ({
  createConversationMessage: vi.fn(), listVisitorConversation: vi.fn(),
}))
const { getOrCreateVisitorToken } = vi.hoisted(() => ({ getOrCreateVisitorToken: vi.fn() }))

vi.mock('../../../../lib/support-service', () => ({
  createConversationMessage, listVisitorConversation,
  getVisitorCookieOptions: () => ({ httpOnly: true, secure: true, sameSite: 'lax', maxAge: 2_592_000, path: '/' }),
  checkSupportRateLimit: () => true,
}))
vi.mock('../../../../lib/support-security', () => ({
  VISITOR_TOKEN_COOKIE: 'carbi_support_visitor', getOrCreateVisitorToken,
}))

import { GET, POST } from './route'

describe('/api/support/conversations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a conversation anonymously and issues a secure visitor cookie', async () => {
    getOrCreateVisitorToken.mockReturnValue({ token: 'visitor-token', setCookie: true })
    createConversationMessage.mockResolvedValue({ id: 'conversation-1', status: 'open' })

    const response = await POST(new Request('https://carbi.com.br/api/support/conversations', {
      method: 'POST', body: JSON.stringify({ name: 'Ana', message: 'Olá' }), headers: { 'content-type': 'application/json' },
    }) as never)

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ conversation: { id: 'conversation-1', status: 'open' } })
    expect(createConversationMessage).toHaveBeenCalledWith({ name: 'Ana', email: undefined, message: 'Olá' }, 'visitor-token')
    expect(response.cookies.get('carbi_support_visitor')).toMatchObject({ value: 'visitor-token', httpOnly: true, secure: true, sameSite: 'lax' })
  })

  it('returns no conversation when a visitor has no cookie', async () => {
    const response = await GET(new Request('https://carbi.com.br/api/support/conversations') as never)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ conversation: null })
    expect(listVisitorConversation).not.toHaveBeenCalled()
  })

  it('rejects invalid visitor messages before persistence', async () => {
    const response = await POST(new Request('https://carbi.com.br/api/support/conversations', {
      method: 'POST', body: JSON.stringify({ message: 'x'.repeat(2_001) }), headers: { 'content-type': 'application/json' },
    }) as never)

    expect(response.status).toBe(400)
    expect(createConversationMessage).not.toHaveBeenCalled()
  })

  it('rejects honeypot submissions before issuing a cookie', async () => {
    const response = await POST(new Request('https://carbi.com.br/api/support/conversations', {
      method: 'POST', body: JSON.stringify({ message: 'Olá', honeypot: 'bot' }), headers: { 'content-type': 'application/json' },
    }) as never)

    expect(response.status).toBe(400)
    expect(response.cookies.get('carbi_support_visitor')).toBeUndefined()
  })
})
