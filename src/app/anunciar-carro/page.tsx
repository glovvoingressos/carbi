import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function AnunciarCarroPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('sb-access-token')?.value || cookieStore.get('sb-ygrnbudqtfuadkpbgttw-auth-token')?.value

  if (!token) {
    redirect('/entrar?redirect=/anunciar-carro/fluxo')
  }

  const supabase = getSupabaseServerClient(token)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/entrar?redirect=/anunciar-carro/fluxo')
  }

  redirect('/anunciar-carro/fluxo')
}
