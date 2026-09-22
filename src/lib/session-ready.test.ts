import { afterEach, describe, expect, it, vi } from 'vitest'

import { resolveSessionOrTimeout } from './session-ready'

describe('resolveSessionOrTimeout', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null when the session request never settles', async () => {
    vi.useFakeTimers()
    const pendingSession = () => new Promise<{ session: null }>(() => undefined)
    const resultPromise = resolveSessionOrTimeout(pendingSession, 1000)

    await vi.advanceTimersByTimeAsync(1000)

    await expect(resultPromise).resolves.toBeNull()
  })

  it('returns the session when the request succeeds before the timeout', async () => {
    const session = { session: { user: { id: 'user-1' } } }

    await expect(resolveSessionOrTimeout(async () => session, 1000)).resolves.toEqual(session)
  })
})
