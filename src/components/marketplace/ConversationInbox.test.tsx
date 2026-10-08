// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ConversationInbox from './ConversationInbox'

const mocks = vi.hoisted(() => ({ on: vi.fn(), removeChannel: vi.fn(), channel: vi.fn() }))
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('conversation=second') }))
vi.mock('@/lib/supabase-browser', () => ({
  isSupabaseBrowserConfigured: () => true,
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: { access_token: 'test-token', user: { id: 'member' } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    channel: mocks.channel, removeChannel: mocks.removeChannel,
  }),
}))
const conversations = ['first', 'second'].map((id) => ({
  id, last_message_preview: 'Tenho interesse', is_unread: true,
  vehicle_listings_public: { slug: id, title: `Veículo ${id}`, price: 90000, city: 'São Paulo', state: 'SP', images: [] },
}))
beforeEach(() => {
  const channel = { on: mocks.on, subscribe: vi.fn() }
  mocks.on.mockReturnValue(channel)
  channel.subscribe.mockReturnValue(channel)
  mocks.channel.mockReturnValue(channel)
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal('fetch', vi.fn(async (url) => ({ ok: true, json: async () => String(url).endsWith('/conversations') ? conversations : [] })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks() })

it('preserves the conversation deep link, read receipt, realtime subscription and send target', async () => {
  const view = render(<ConversationInbox />)
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/marketplace/conversations/second/messages', expect.anything()))
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/marketplace/conversations/second/read', expect.objectContaining({ method: 'POST' })))
  expect(mocks.on).toHaveBeenCalledWith('postgres_changes', expect.objectContaining({ filter: 'conversation_id=eq.second' }), expect.any(Function))
  // Both responsive renderings retain the requested chat. Mobile opens it immediately.
  expect(screen.getAllByRole('link', { name: /Ver anúncio/ })).toHaveLength(2)
  const input = screen.getAllByRole('textbox', { name: 'Mensagem' })[0]
  fireEvent.change(input, { target: { value: 'Olá, ainda disponível?' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/marketplace/conversations/second/messages', expect.objectContaining({
    method: 'POST', body: JSON.stringify({ message: 'Olá, ainda disponível?' }),
    headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
  })))
  await waitFor(() => expect((input as HTMLInputElement).value).toBe(''))
  view.unmount()
  expect(mocks.removeChannel).toHaveBeenCalledTimes(3)
})
