import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getSupabaseServerClientWithCookies, getUser, redirect } = vi.hoisted(() => ({
  getSupabaseServerClientWithCookies: vi.fn(),
  getUser: vi.fn(),
  redirect: vi.fn((url: string): never => { throw new Error(`NEXT_REDIRECT:${url}`) }),
}))

vi.mock('@/lib/supabase-server', () => ({ getSupabaseServerClientWithCookies }))
vi.mock('next/navigation', () => ({ redirect }))

import AdminSupportInbox from '@/components/admin/AdminSupportInbox'
import AdminSupportPage from './page'

const originalSupportAdminEmails = process.env.SUPPORT_ADMIN_EMAILS

describe('/admin/suporte', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSupabaseServerClientWithCookies.mockResolvedValue({ auth: { getUser } })
    process.env.SUPPORT_ADMIN_EMAILS = 'admin@carbi.com.br'
  })

  afterEach(() => {
    if (originalSupportAdminEmails === undefined) delete process.env.SUPPORT_ADMIN_EMAILS
    else process.env.SUPPORT_ADMIN_EMAILS = originalSupportAdminEmails
  })

  it('redirects a request without a server-validated session before rendering the inbox', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })

    await expect(Promise.resolve().then(() => AdminSupportPage())).rejects.toThrow('NEXT_REDIRECT:/entrar?redirect=/admin/suporte')

    expect(redirect).toHaveBeenCalledWith('/entrar?redirect=/admin/suporte')
  })

  it('redirects a signed-in user whose server-validated email is not allowlisted', async () => {
    getUser.mockResolvedValue({ data: { user: { email: 'member@carbi.com.br' } }, error: null })

    await expect(Promise.resolve().then(() => AdminSupportPage())).rejects.toThrow('NEXT_REDIRECT:/entrar?redirect=/admin/suporte')

    expect(redirect).toHaveBeenCalledWith('/entrar?redirect=/admin/suporte')
  })

  it('renders the inbox when the server-validated email is allowlisted', async () => {
    getUser.mockResolvedValue({ data: { user: { email: ' ADMIN@CARBI.COM.BR ' } }, error: null })

    const page = await AdminSupportPage()

    expect(page.type).toBe(AdminSupportInbox)
    expect(redirect).not.toHaveBeenCalled()
  })
})
