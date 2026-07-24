'use client'

import AccountLayout from '@/components/marketplace/AccountLayout'
import { Shield, Bell, User, Mail, Phone, Lock, ChevronRight, CreditCard, HelpCircle, FileText, LogOut } from 'lucide-react'
import Link from 'next/link'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const settingsSections = [
  {
    title: 'Conta',
    description: 'Gerencie seus dados pessoais',
    items: [
      { href: '/minha-conta', label: 'Meu perfil', description: 'Nome, foto e informações pessoais', icon: User },
      { href: '/minha-conta/configuracoes', label: 'Segurança', description: 'Senha e proteção da conta', icon: Lock },
    ]
  },
  {
    title: 'Preferências',
    description: 'Personalize sua experiência',
    items: [
      { href: '/minha-conta/notificacoes', label: 'Notificações', description: 'Alertas de mensagens e propostas', icon: Bell },
    ]
  },
  {
    title: 'Suporte',
    description: 'Precisa de ajuda?',
    items: [
      { href: '/ajuda', label: 'Central de ajuda', description: 'Dúvidas frequentes e contato', icon: HelpCircle },
      { href: '/termos', label: 'Termos de uso', description: 'Política e termos', icon: FileText },
    ]
  },
]

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

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 bg-gray-100 rounded-2xl animate-pulse w-48" />
      <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  )
  if (!user) return null

  return (
    <AccountLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Configurações</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie sua conta e preferências</p>
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <div key={section.title}>
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#1A1A1A]">{section.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {section.items.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 p-5 hover:bg-[#F8F9FA] transition-colors group ${
                    index < section.items.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-[#D4F576]/20 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A1A]">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* App Info */}
        <div className="text-center py-6">
          <p className="text-xs text-gray-400">Carbi v1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">Marketplace de seminovos</p>
        </div>
      </div>
    </AccountLayout>
  )
}
