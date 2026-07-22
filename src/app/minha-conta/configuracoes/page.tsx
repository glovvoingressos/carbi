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

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-secondary)]" /></div>
  if (!user) return null

  return (
    <AccountLayout user={user}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center">
            <Settings className="w-5 h-5 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)]">Configurações</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Preferências da sua conta</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Conta e segurança</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Gerencie email, senha e autenticação.</p>
            </div>
          </div>
        </div>
        <Link href="/minha-conta/notificacoes" className="block bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Notificações</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Configure alertas de preços e mensagens.</p>
            </div>
          </div>
        </Link>
      </motion.div>
    </AccountLayout>
  )
}
