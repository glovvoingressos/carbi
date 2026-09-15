import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireSupportAdmin, getSupabaseAdminClient, SupportAdminAuthorizationError } = vi.hoisted(() => {
  class SupportAdminAuthorizationError extends Error {}
  return {
    requireSupportAdmin: vi.fn(),
    getSupabaseAdminClient: vi.fn(),
    SupportAdminAuthorizationError,
  }
})

vi.mock('../../../../../lib/support-admin', () => ({
  requireSupportAdmin,
  SupportAdminAuthorizationError,
}))
vi.mock('../../../../../lib/supabase-server', () => ({ getSupabaseAdminClient }))

import { GET as listConversations } from './route'
import { GET as getConversation, PATCH as updateConversation } from './[id]/route'
import { POST as replyToConversation } from './[id]/messages/route'

const conversationId = '8f2f92c5-4b35-4dfe-bdcb-2285b4b5168a'

function query(result: { data: unknown; error: unknown; count?: number }) {
  const builder: any = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn(async () => result),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    single: vi.fn(async () => result),
  }
  return builder
}

describe('/api/admin/support/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireSupportAdmin.mockResolvedValue({ userId: 'admin-user', email: 'admin@carbi.com.br' })
  })

  it('returns newest conversations to an admin without a visitor cookie', async () => {
    const conversations = query({
      data: [{ id: conversationId, visitor_name: 'Ana', status: 'open', last_message_at: '2026-09-15T12:00:00.000Z' }],
      error: null,
      count: 1,
    })
    getSupabaseAdminClient.mockReturnValue({ from: vi.fn(() => conversations) })

    const response = await listConversations(new Request('https://carbi.com.br/api/admin/support/conversations?page=1&limit=25', {
      headers: { authorization: 'Bearer admin-session' },
    }) as never)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      conversations: [{ id: conversationId, visitor_name: 'Ana', status: 'open', last_message_at: '2026-09-15T12:00:00.000Z' }],
      pagination: { page: 1, limit: 25, total: 1 },
    })
    expect(conversations.order).toHaveBeenCalledWith('last_message_at', { ascending: false })
  })

  it('returns unauthorized for a missing bearer session', async () => {
    requireSupportAdmin.mockRejectedValue(new SupportAdminAuthorizationError())

    const response = await listConversations(new Request('https://carbi.com.br/api/admin/support/conversations') as never)

    expect(response.status).toBe(401)
    expect(getSupabaseAdminClient).not.toHaveBeenCalled()
  })

  it('rejects a malformed conversation ID before accessing the database', async () => {
    const response = await getConversation(new Request('https://carbi.com.br/api/admin/support/conversations/not-an-id', {
      headers: { authorization: 'Bearer admin-session' },
    }) as never, { params: Promise.resolve({ id: 'not-an-id' }) })

    expect(response.status).toBe(400)
    expect(getSupabaseAdminClient).not.toHaveBeenCalled()
  })

  it('returns a conversation and messages to an admin without its visitor token', async () => {
    const conversation = query({ data: { id: conversationId, status: 'open', visitor_email: 'ana@example.com' }, error: null })
    const messages = query({ data: [{ id: 'message-1', sender_type: 'visitor', body: 'Olá' }], error: null })
    messages.order.mockResolvedValue({ data: [{ id: 'message-1', sender_type: 'visitor', body: 'Olá' }], error: null })
    getSupabaseAdminClient.mockReturnValue({ from: vi.fn().mockReturnValueOnce(conversation).mockReturnValueOnce(messages) })

    const response = await getConversation(new Request(`https://carbi.com.br/api/admin/support/conversations/${conversationId}`, {
      headers: { authorization: 'Bearer admin-session' },
    }) as never, { params: Promise.resolve({ id: conversationId }) })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      conversation: { id: conversationId, status: 'open', visitor_email: 'ana@example.com', messages: [{ id: 'message-1', sender_type: 'visitor', body: 'Olá' }] },
    })
  })

  it('validates reply limits before persisting an admin message', async () => {
    const response = await replyToConversation(new Request(`https://carbi.com.br/api/admin/support/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { authorization: 'Bearer admin-session', 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'x'.repeat(2_001) }),
    }) as never, { params: Promise.resolve({ id: conversationId }) })

    expect(response.status).toBe(400)
    expect(getSupabaseAdminClient).not.toHaveBeenCalled()
  })

  it('allows an admin reply and marks the conversation as waiting for the visitor', async () => {
    const message = query({ data: { id: 'message-2', conversation_id: conversationId, sender_type: 'admin', body: 'Olá Ana' }, error: null })
    const activity = query({ data: null, error: null })
    getSupabaseAdminClient.mockReturnValue({ from: vi.fn().mockReturnValueOnce(message).mockReturnValueOnce(activity) })

    const response = await replyToConversation(new Request(`https://carbi.com.br/api/admin/support/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { authorization: 'Bearer admin-session', 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Olá Ana' }),
    }) as never, { params: Promise.resolve({ id: conversationId }) })

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ message: { id: 'message-2', conversation_id: conversationId, sender_type: 'admin', body: 'Olá Ana' } })
    expect(message.insert).toHaveBeenCalledWith({
      conversation_id: conversationId,
      sender_type: 'admin',
      sender_name: 'admin@carbi.com.br',
      body: 'Olá Ana',
    })
    expect(activity.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'waiting_visitor' }))
  })

  it('accepts only open or closed status transitions', async () => {
    const response = await updateConversation(new Request(`https://carbi.com.br/api/admin/support/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: { authorization: 'Bearer admin-session', 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'waiting_visitor' }),
    }) as never, { params: Promise.resolve({ id: conversationId }) })

    expect(response.status).toBe(400)
    expect(getSupabaseAdminClient).not.toHaveBeenCalled()
  })

  it('allows an admin to close a conversation', async () => {
    const updatedConversation = query({ data: { id: conversationId, status: 'closed' }, error: null })
    getSupabaseAdminClient.mockReturnValue({ from: vi.fn(() => updatedConversation) })

    const response = await updateConversation(new Request(`https://carbi.com.br/api/admin/support/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: { authorization: 'Bearer admin-session', 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'closed' }),
    }) as never, { params: Promise.resolve({ id: conversationId }) })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ conversation: { id: conversationId, status: 'closed' } })
    expect(updatedConversation.update).toHaveBeenCalledWith({ status: 'closed' })
  })
})
