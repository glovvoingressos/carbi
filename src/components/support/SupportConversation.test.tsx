// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SupportConversation from './SupportConversation'
import { getSupportWidgetTransition } from './SupportWidget'

const conversation = {
  id: 'conversation-1',
  visitor_name: 'Ana',
  visitor_email: 'ana@example.com',
  status: 'waiting_visitor' as const,
  created_at: '2026-09-15T12:00:00.000Z',
  updated_at: '2026-09-15T12:01:00.000Z',
  last_message_at: '2026-09-15T12:01:00.000Z',
  messages: [
    {
      id: 'message-1',
      conversation_id: 'conversation-1',
      sender_type: 'visitor' as const,
      sender_name: 'Ana',
      body: 'Preciso de ajuda com meu anúncio.',
      created_at: '2026-09-15T12:00:00.000Z',
    },
    {
      id: 'message-2',
      conversation_id: 'conversation-1',
      sender_type: 'admin' as const,
      sender_name: 'Equipe Carbi',
      body: 'Claro, Ana. Como podemos ajudar?',
      created_at: '2026-09-15T12:01:00.000Z',
    },
  ],
}

const createdConversation = {
  id: 'conversation-1',
  visitor_name: 'Ana',
  visitor_email: null,
  status: 'open' as const,
  created_at: '2026-09-15T12:00:00.000Z',
  updated_at: '2026-09-15T12:00:00.000Z',
  last_message_at: '2026-09-15T12:00:00.000Z',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('SupportConversation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ conversation: null })))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('lets an anonymous visitor provide an optional email before sending a message', async () => {
    render(<SupportConversation isOpen />)

    expect(await screen.findByLabelText('Sua mensagem')).toBeTruthy()
    const email = screen.getByLabelText('Seu e-mail (opcional)') as HTMLInputElement
    expect(email.required).toBe(false)
    expect(screen.getByText(/você não precisa entrar/i)).toBeTruthy()
  })

  it('announces that an existing conversation is loading', () => {
    vi.mocked(fetch).mockReturnValue(new Promise<Response>(() => {}))

    render(<SupportConversation isOpen />)

    expect(screen.getByText('Carregando sua conversa…')).toBeTruthy()
  })

  it('creates a conversation and confirms a visitor message was sent', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ conversation: null }))
      .mockResolvedValueOnce(jsonResponse({ conversation: createdConversation }))

    render(<SupportConversation isOpen />)

    await user.type(screen.getByLabelText('Seu nome (opcional)'), 'Ana')
    await user.type(screen.getByLabelText('Sua mensagem'), 'Preciso de ajuda com meu anúncio.')
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }))

    await screen.findByText(/mensagem enviada/i)
    expect(fetchMock).toHaveBeenLastCalledWith('/api/support/conversations', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Ana', email: '', message: 'Preciso de ajuda com meu anúncio.' }),
    }))
    expect(screen.getByText('Preciso de ajuda com meu anúncio.')).toBeTruthy()
  })

  it('keeps the draft visible and announces an API error', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ conversation: null }))
      .mockResolvedValueOnce(jsonResponse({ error: 'Tente novamente em instantes.' }, 429))

    render(<SupportConversation isOpen />)

    await user.type(screen.getByLabelText('Sua mensagem'), 'Minha mensagem')
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }))

    expect((await screen.findByRole('alert')).textContent).toContain('Tente novamente em instantes.')
    expect((screen.getByLabelText('Sua mensagem') as HTMLTextAreaElement).value).toBe('Minha mensagem')
  })

  it('renders the conversation history including an admin response', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ conversation }))

    render(<SupportConversation isOpen />)

    expect(await screen.findByText('Claro, Ana. Como podemos ajudar?')).toBeTruthy()
    expect(screen.getByText('Equipe Carbi')).toBeTruthy()
    expect(screen.getByText('Aguardando sua resposta')).toBeTruthy()
  })

  it('polls once every four seconds while open and stops after it closes', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.mocked(fetch)
    const initialRequest = new Promise<Response>(() => {})
    fetchMock.mockReturnValue(initialRequest)

    const { rerender, unmount } = render(<SupportConversation isOpen />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_000)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    rerender(<SupportConversation isOpen={false} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    unmount()
  })

  it('submits the draft when Enter is pressed without Shift', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ conversation: null }))
      .mockResolvedValueOnce(jsonResponse({ conversation }))

    render(<SupportConversation isOpen />)

    const message = await screen.findByLabelText('Sua mensagem')
    await user.type(message, 'Posso enviar pelo teclado?')
    fireEvent.keyDown(message, { key: 'Enter' })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(/mensagem enviada/i)).toBeTruthy()
  })

  it('uses an instant widget transition when reduced motion is preferred', () => {
    expect(getSupportWidgetTransition(true)).toEqual({ duration: 0 })
  })
})
