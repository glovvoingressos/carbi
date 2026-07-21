import type { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AccountLayout from '@/components/marketplace/AccountLayout'

export const metadata: Metadata = {
  title: 'Minha conta | Carbi',
  description: 'Gerencie seu perfil, anúncios e conversas.',
  robots: { index: false, follow: false },
}

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* server component */ }
        },
      },
    }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/entrar?redirect=/minha-conta')
  }
  const { data: profile } = await supabase
    .from('users')
    .select('full_name,avatar_url')
    .eq('id', session!.user.id)
    .maybeSingle()
  return {
    email: session!.user.email || '',
    fullName: profile?.full_name || '',
    avatarUrl: profile?.avatar_url || '',
  }
}

export default async function MinhaContaPage() {
  const user = await getUser()
  return <AccountLayout user={user} />
}
