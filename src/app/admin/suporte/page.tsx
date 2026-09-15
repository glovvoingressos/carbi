import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import AdminSupportInbox from '@/components/admin/AdminSupportInbox'
import { getSupportAdminEmails } from '@/lib/support-admin'
import { getSupabaseServerClientWithCookies } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'Suporte | Admin',
  robots: { index: false, follow: false },
}

export default async function AdminSupportPage() {
  let user: { email?: string | null } | null = null

  try {
    const supabase = await getSupabaseServerClientWithCookies()
    const { data, error } = await supabase.auth.getUser()
    if (!error) user = data.user
  } catch {
    redirectToSupportSignIn()
  }

  const email = user?.email?.trim().toLowerCase()
  if (!email || !getSupportAdminEmails().has(email)) {
    redirectToSupportSignIn()
  }

  return <AdminSupportInbox />
}

function redirectToSupportSignIn(): never {
  redirect('/entrar?redirect=/admin/suporte')
}
