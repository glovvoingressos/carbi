import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getSupabaseAdminClient, hashVisitorToken } = vi.hoisted(() => ({
  getSupabaseAdminClient: vi.fn(),
  hashVisitorToken: vi.fn(),
}))

vi.mock('./supabase-server', () => ({ getSupabaseAdminClient }))
vi.mock('./support-security', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./support-security')>()),
  hashVisitorToken,
}))

import {
  appendVisitorMessage,
  checkSupportRateLimit,
  createConversationMessage,
  listVisitorConversation,
} from './support-service'

type QueryResult = { data: unknown; error: unknown }

function query(result: QueryResult, terminalUpdate = false) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(async () => result),
    insert: vi.fn(() => builder),
    update: vi.fn(() => terminalUpdate ? { eq: vi.fn(async () => result) } : builder),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
  }
  return builder
}

describe('support service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hashVisitorToken.mockResolvedValue('hashed-visitor-token')
  })

  it('creates a conversation with only the hashed token and its first visitor message', async () => {
    const findConversation = query({ data: null, error: null })
    const insertConversation = query({
      data: { id: 'conversation-1', visitor_token_hash: 'hashed-visitor-token', status: 'open' },
      error: null,
    })
    const insertMessage = query({
      data: { id: 'message-1', conversation_id: 'conversation-1', sender_type: 'visitor', body: 'Preciso de ajuda' },
      error: null,
    })
    const updateConversation = query({ data: null, error: null })
    const from = vi.fn()
      .mockReturnValueOnce(findConversation)
      .mockReturnValueOnce(insertConversation)
      .mockReturnValueOnce(insertMessage)
      .mockReturnValueOnce(updateConversation)
    getSupabaseAdminClient.mockReturnValue({ from })

    await expect(createConversationMessage({ name: 'Ana', message: 'Preciso de ajuda' }, 'raw-token')).resolves.toMatchObject({
      id: 'conversation-1',
      status: 'open',
    })

    expect(hashVisitorToken).toHaveBeenCalledWith('raw-token')
    expect(insertConversation.insert).toHaveBeenCalledWith({
      visitor_token_hash: 'hashed-visitor-token',
      visitor_name: 'Ana',
      visitor_email: null,
    })
    expect(insertMessage.insert).toHaveBeenCalledWith({
      conversation_id: 'conversation-1', sender_type: 'visitor', sender_name: 'Ana', body: 'Preciso de ajuda',
    })
  })

  it('reuses the token-owned conversation and reopens it when the visitor sends again', async () => {
    const findConversation = query({ data: { id: 'conversation-1', status: 'closed' }, error: null })
    const insertMessage = query({ data: { id: 'message-2', conversation_id: 'conversation-1', sender_type: 'visitor', body: 'Ainda preciso' }, error: null })
    const updateConversation = query({ data: null, error: null })
    const from = vi.fn()
      .mockReturnValueOnce(findConversation)
      .mockReturnValueOnce(insertMessage)
      .mockReturnValueOnce(updateConversation)
    getSupabaseAdminClient.mockReturnValue({ from })

    await createConversationMessage({ message: 'Ainda preciso' }, 'raw-token')

    expect(from).toHaveBeenCalledTimes(3)
    expect(updateConversation.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'open' }))
  })

  it('returns a conversation only for the matching hashed visitor token', async () => {
    const conversation = query({ data: { id: 'conversation-1', visitor_token_hash: 'hashed-visitor-token' }, error: null })
    const messages = query({ data: [{ id: 'message-1', body: 'Olá' }], error: null })
    const from = vi.fn().mockReturnValueOnce(conversation).mockReturnValueOnce(messages)
    getSupabaseAdminClient.mockReturnValue({ from })

    await expect(listVisitorConversation('raw-token')).resolves.toEqual({
      id: 'conversation-1', visitor_token_hash: 'hashed-visitor-token', messages: [{ id: 'message-1', body: 'Olá' }],
    })
    expect(conversation.eq).toHaveBeenCalledWith('visitor_token_hash', 'hashed-visitor-token')
  })

  it('rejects a message when the conversation belongs to another visitor token', async () => {
    const ownedConversation = query({ data: null, error: null })
    getSupabaseAdminClient.mockReturnValue({ from: vi.fn(() => ownedConversation) })

    await expect(appendVisitorMessage('conversation-1', 'another-token', { message: 'Não deveria enviar' }))
      .rejects.toMatchObject({ code: 'not_found' })
    expect(ownedConversation.insert).not.toHaveBeenCalled()
  })

  it('enforces independent IP and visitor-token buckets', () => {
    const ip = `ip-${Math.random()}`
    for (let attempt = 0; attempt < 12; attempt += 1) {
      expect(checkSupportRateLimit(ip, `rotating-token-${attempt}`)).toBe(true)
    }
    expect(checkSupportRateLimit(ip, 'rotating-token-final')).toBe(false)

    const token = `token-${Math.random()}`
    for (let attempt = 0; attempt < 12; attempt += 1) {
      expect(checkSupportRateLimit(`rotating-ip-${attempt}`, token)).toBe(true)
    }
    expect(checkSupportRateLimit('rotating-ip-final', token)).toBe(false)
  })

  it('returns the persisted message when activity reconciliation is unavailable after retry', async () => {
    const ownedConversation = query({ data: { id: 'conversation-1' }, error: null })
    const insertedMessage = query({ data: { id: 'message-3', conversation_id: 'conversation-1', sender_type: 'visitor', body: 'Persistir' }, error: null })
    const failedActivityUpdate = query({ data: null, error: { message: 'temporary database failure' } }, true)
    const reconciledActivityUpdate = query({ data: null, error: { message: 'database still unavailable' } }, true)
    const from = vi.fn()
      .mockReturnValueOnce(ownedConversation)
      .mockReturnValueOnce(insertedMessage)
      .mockReturnValueOnce(failedActivityUpdate)
      .mockReturnValueOnce(reconciledActivityUpdate)
    getSupabaseAdminClient.mockReturnValue({ from })

    await expect(appendVisitorMessage('conversation-1', 'raw-token', { message: 'Persistir' })).resolves.toMatchObject({
      id: 'message-3', body: 'Persistir',
    })
    expect(from).toHaveBeenCalledTimes(4)
  })
})
