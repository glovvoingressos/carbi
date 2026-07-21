import { redirect } from 'next/navigation'
import { getSupabaseServerClientWithCookies } from '@/lib/supabase-server'

export default async function AnunciarCarroPage() {
  const supabase = await getSupabaseServerClientWithCookies()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/entrar?redirect=/anunciar-carro/fluxo')
  }

  redirect('/anunciar-carro/fluxo')
}
