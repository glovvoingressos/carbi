import { beforeEach, describe, expect, it, vi } from 'vitest'

const { appendVisitorMessage } = vi.hoisted(() => ({ appendVisitorMessage: vi.fn() }))
vi.mock('../../../../../lib/support-service', () => ({ appendVisitorMessage, checkSupportRateLimit: () => true }))

import { POST } from './route'

describe('/api/support/conversations/messages', () => {
  beforeEach(() => vi.clearAllMocks())

  it('appends a validated visitor message for its cookie-owned conversation', async () => {
    appendVisitorMessage.mockResolvedValue({ id: 'message-2', body: 'Mais uma dúvida' })
    const response = await POST(new Request('https://carbi.com.br/api/support/conversations/messages', {
      method: 'POST', headers: { 'content-type': 'application/json', cookie: 'carbi_support_visitor=visitor-token' },
      body: JSON.stringify({ conversationId: 'conversation-1', message: 'Mais uma dúvida' }),
    }) as never)

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ message: { id: 'message-2', body: 'Mais uma dúvida' } })
    expect(appendVisitorMessage).toHaveBeenCalledWith('conversation-1', 'visitor-token', { name: undefined, email: undefined, message: 'Mais uma dúvida' })
  })
})
