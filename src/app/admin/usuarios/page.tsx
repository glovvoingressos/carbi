import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import AdminRegisteredUsers from '@/components/admin/AdminRegisteredUsers'
import { getSupportAdminEmails } from '@/lib/support-admin'
import { getSupabaseServerClientWithCookies } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'Usuários cadastrados | Admin',
  robots: { index: false, follow: false },
}

export default async function AdminUsersPage() {
  let email: string | undefined

  try {
    const supabase = await getSupabaseServerClientWithCookies()
    const { data, error } = await supabase.auth.getUser()
    if (!error) email = data.user?.email?.trim().toLowerCase()
  } catch {
    redirectToAdminSignIn()
  }

  if (!email || !getSupportAdminEmails().has(email)) redirectToAdminSignIn()

  return <AdminRegisteredUsers />
}

function redirectToAdminSignIn(): never {
  redirect('/entrar?redirect=/admin/usuarios')
}
