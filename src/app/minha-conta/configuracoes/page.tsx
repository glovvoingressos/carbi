'use client'

import AccountLayout from '@/components/marketplace/AccountLayout'
import { Shield, Bell, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ConfiguracoesPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; fullName: string; avatarUrl: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) { router.replace('/entrar'); return }
    const supabase = getSupabaseBrowserClient()
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/entrar?redirect=/minha-conta/configuracoes'); return }
      const { data } = await supabase.from('users').select('full_name,avatar_url').eq('id', session.user.id).maybeSingle()
      setUser({ email: session.user.email || '', fullName: data?.full_name || '', avatarUrl: data?.avatar_url || '' })
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
  if (!user) return null

  return (
    <AccountLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500 mt-1">Preferências e privacidade da conta</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <Link
            href="/minha-conta"
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Conta e Segurança</p>
              <p className="text-xs text-gray-500 mt-0.5">Nome, telefone, email e senha</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>

          <div className="border-t border-gray-100" />

          <Link
            href="/minha-conta/notificacoes"
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Notificações</p>
              <p className="text-xs text-gray-500 mt-0.5">Alertas de mensagens e propostas</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>
        </div>
      </div>
    </AccountLayout>
  )
}
