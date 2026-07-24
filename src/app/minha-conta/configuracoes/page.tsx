'use client'

import AccountLayout from '@/components/marketplace/AccountLayout'
import { motion } from 'motion/react'
import { Settings, Shield, Bell } from 'lucide-react'
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

  if (loading) return <div className="flex items-center justify-center min-h-dvh bg-[#F7F7F7]"><Loader2 className="w-5 h-5 animate-spin text-[#999]" /></div>
  if (!user) return null

  return (
    <AccountLayout user={user}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
            <Settings className="w-5 h-5 text-gray-700" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 font-[family-name:var(--font-heading)]">Configurações</h2>
            <p className="text-xs text-gray-500">Gerencie preferências e privacidade da sua conta</p>
          </div>
        </div>

        <Link href="/minha-conta" className="block bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:border-gray-300 transition-all">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
              <Shield className="w-5 h-5 text-gray-700" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">Conta e Segurança</p>
              <p className="text-xs text-gray-500 mt-0.5">Gerencie seu nome, telefone, email e alteração de senha.</p>
            </div>
          </div>
        </Link>

        <Link href="/minha-conta/notificacoes" className="block bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:border-gray-300 transition-all">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
              <Bell className="w-5 h-5 text-gray-700" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">Notificações e Alertas</p>
              <p className="text-xs text-gray-500 mt-0.5">Configure alertas de mensagens, propostas recebidas e atualizações.</p>
            </div>
          </div>
        </Link>
      </motion.div>
    </AccountLayout>
  )
}
