// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getSession, replace } = vi.hoisted(() => ({
  getSession: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('../../lib/supabase-browser', () => ({
  getSupabaseBrowserClient: () => ({ auth: { getSession } }),
  isSupabaseBrowserConfigured: () => true,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}))

import AdminSupportInbox from './AdminSupportInbox'

const olderConversation = {
  id: '11111111-1111-4111-8111-111111111111',
  visitor_name: 'Bruno',
  visitor_email: 'bruno@example.com',
  status: 'waiting_visitor',
  last_message_at: '2026-09-15T10:00:00.000Z',
  created_at: '2026-09-15T09:00:00.000Z',
  updated_at: '2026-09-15T10:00:00.000Z',
}

const newestConversation = {
  id: '22222222-2222-4222-8222-222222222222',
  visitor_name: 'Ana',
  visitor_email: 'ana@example.com',
  status: 'open',
  last_message_at: '2026-09-15T12:00:00.000Z',
  created_at: '2026-09-15T11:00:00.000Z',
  updated_at: '2026-09-15T12:00:00.000Z',
}

const message = {
  id: '33333333-3333-4333-8333-333333333333',
  conversation_id: newestConversation.id,
  sender_type: 'visitor',
  sender_name: 'Ana',
  body: 'Preciso de ajuda com meu anúncio.',
  created_at: '2026-09-15T12:00:00.000Z',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function setAuthenticatedSession() {
  getSession.mockResolvedValue({ data: { session: { access_token: 'admin-token', user: { email: 'admin@carbi.com.br' } } } })
}

function supportFetch({ conversations = [olderConversation, newestConversation], detail = newestConversation }: {
  conversations?: typeof newestConversation[]
  detail?: typeof newestConversation
} = {}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url === '/api/admin/support/conversations?page=1&limit=100') {
      return jsonResponse({ conversations, pagination: { page: 1, limit: 100, total: conversations.length } })
    }
    if (url === `/api/admin/support/conversations/${newestConversation.id}` && init?.method === 'PATCH') {
      return jsonResponse({ conversation: { ...detail, status: JSON.parse(String(init.body)).status } })
    }
    if (url === `/api/admin/support/conversations/${newestConversation.id}/messages`) {
      return jsonResponse({ message: { ...message, id: '44444444-4444-4444-8444-444444444444', sender_type: 'admin', sender_name: 'admin@carbi.com.br', body: JSON.parse(String(init?.body)).message } }, 201)
    }
    if (url === `/api/admin/support/conversations/${newestConversation.id}`) {
      return jsonResponse({ conversation: { ...detail, messages: [message] } })
    }
    throw new Error(`Unexpected request: ${url}`)
  })
}

describe('AdminSupportInbox', () => {
  beforeEach(() => {
    setAuthenticatedSession()
    vi.stubGlobal('fetch', supportFetch())
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('sorts conversations by the most recent activity', async () => {
    render(<AdminSupportInbox />)

    await screen.findByRole('button', { name: /ana/i })
    const labels = screen.getAllByRole('button', { name: /ana|bruno/i }).map((item) => item.getAttribute('aria-label'))

    expect(labels).toEqual(['Abrir conversa de Ana', 'Abrir conversa de Bruno'])
  })

  it('loads every API page so older conversations remain searchable and openable', async () => {
    const user = userEvent.setup()
    const paginatedConversations = Array.from({ length: 101 }, (_, index) => ({
      ...newestConversation,
      id: `conversation-${index + 1}`,
      visitor_name: index === 100 ? 'Visitante antigo' : `Visitante ${index + 1}`,
      visitor_email: `visitante-${index + 1}@example.com`,
      last_message_at: `2026-09-15T${String(12 - Math.floor(index / 10)).padStart(2, '0')}:${String(59 - (index % 10)).padStart(2, '0')}:00.000Z`,
    }))
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/admin/support/conversations?page=1&limit=100') {
        return jsonResponse({ conversations: paginatedConversations.slice(0, 100), pagination: { page: 1, limit: 100, total: 101 } })
      }
      if (url === '/api/admin/support/conversations?page=2&limit=100') {
        return jsonResponse({ conversations: paginatedConversations.slice(100), pagination: { page: 2, limit: 100, total: 101 } })
      }
      const conversationId = url.match(/^\/api\/admin\/support\/conversations\/(conversation-\d+)$/)?.[1]
      if (conversationId) {
        const conversation = paginatedConversations.find((item) => item.id === conversationId)
        return jsonResponse({ conversation: { ...conversation, messages: [{ ...message, id: `message-${conversationId}`, conversation_id: conversationId, sender_name: conversation?.visitor_name, body: `Histórico de ${conversation?.visitor_name}` }] } })
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminSupportInbox />)

    await screen.findByRole('button', { name: 'Abrir conversa de Visitante antigo' })
    await user.type(screen.getByLabelText('Buscar conversas'), 'antigo')
    await user.click(screen.getByRole('button', { name: 'Abrir conversa de Visitante antigo' }))

    expect(await screen.findByText('Histórico de Visitante antigo')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/support/conversations?page=1&limit=100', expect.anything())
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/support/conversations?page=2&limit=100', expect.anything())
  })

  it('filters conversations by status and visitor details', async () => {
    const user = userEvent.setup()
    render(<AdminSupportInbox />)

    await screen.findByRole('button', { name: /ana/i })
    await user.selectOptions(screen.getByLabelText('Status'), 'waiting_visitor')
    expect(screen.getByRole('button', { name: /bruno/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /ana/i })).toBeNull()

    await user.selectOptions(screen.getByLabelText('Status'), 'all')
    await user.type(screen.getByLabelText('Buscar conversas'), 'ana@example.com')
    expect(screen.getByRole('button', { name: /ana/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /bruno/i })).toBeNull()
  })

  it('shows an empty state when there are no support conversations', async () => {
    vi.stubGlobal('fetch', supportFetch({ conversations: [] }))

    render(<AdminSupportInbox />)

    expect(await screen.findByText('Nenhuma conversa encontrada')).toBeTruthy()
  })

  it('sends an admin reply and renders it in the conversation', async () => {
    const user = userEvent.setup()
    render(<AdminSupportInbox />)

    await screen.findByText(message.body)
    await user.type(screen.getByLabelText('Resposta'), 'Olá Ana, vamos ajudar.')
    await user.click(screen.getByRole('button', { name: 'Enviar resposta' }))

    expect(await screen.findByText('Olá Ana, vamos ajudar.')).toBeTruthy()
    expect(fetch).toHaveBeenCalledWith(`/api/admin/support/conversations/${newestConversation.id}/messages`, expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer admin-token' }),
      body: JSON.stringify({ message: 'Olá Ana, vamos ajudar.' }),
    }))
  })

  it('closes and reopens the selected conversation', async () => {
    const user = userEvent.setup()
    render(<AdminSupportInbox />)

    await screen.findByRole('button', { name: 'Encerrar conversa' })
    await user.click(screen.getByRole('button', { name: 'Encerrar conversa' }))
    expect(await screen.findByRole('button', { name: 'Reabrir conversa' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Reabrir conversa' }))
    expect(await screen.findByRole('button', { name: 'Encerrar conversa' })).toBeTruthy()
  })

  it('refreshes the inbox every four seconds while the admin is authenticated', async () => {
    vi.useFakeTimers()
    const fetchMock = supportFetch()
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminSupportInbox />)
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    const initialListRequests = fetchMock.mock.calls.filter(([url]) => url === '/api/admin/support/conversations?page=1&limit=100').length

    await act(async () => { await vi.advanceTimersByTimeAsync(4_000) })

    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/admin/support/conversations?page=1&limit=100')).toHaveLength(initialListRequests + 1)
  })

  it('redirects visitors without a session to sign in', async () => {
    getSession.mockResolvedValue({ data: { session: null } })

    render(<AdminSupportInbox />)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/entrar?redirect=/admin/suporte'))
  })

  it('shows an unauthorized state when the support API rejects the signed-in user', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'Support admin authorization is required.' }, 401)))

    render(<AdminSupportInbox />)

    expect(await screen.findByText('Acesso não autorizado')).toBeTruthy()
  })
})
