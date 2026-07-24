'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
  LayoutDashboard, Car, MessageCircle, Bell, Settings,
  LogOut, User, Eye, Heart, Star
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

const navItems = [
  { href: '/minha-conta', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/minha-conta/anuncios', label: 'Meus anúncios', icon: Car },
  { href: '/minha-conta/conversas', label: 'Mensagens', icon: MessageCircle },
  { href: '/minha-conta/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/minha-conta/configuracoes', label: 'Configurações', icon: Settings },
]

const ease = [0.23, 1, 0.32, 1] as const
const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease },
}

interface AccountLayoutProps {
  children: React.ReactNode
  user: { email: string; fullName: string; avatarUrl: string }
  stats?: { label: string; value: string | number; icon: any }[]
}

export default function AccountLayout({ children, user, stats = [] }: AccountLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const isActive = (href: string) =>
    href === '/minha-conta' ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    if (!confirm('Tem certeza que deseja sair da conta?')) return
    setLoggingOut(true)
    try {
      await getSupabaseBrowserClient().auth.signOut()
      router.replace('/')
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#F7F7F7] pb-16 fingen-shell">
      {/* Hero banner */}
      <div className="relative h-40 md:h-48 bg-gradient-to-br from-[#E8E4F0] via-[#D8D4E8] to-[#E8E0D8]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#F7F7F7] via-[#F7F7F7]/60 to-transparent" />
      </div>

      <div className="relative max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 -mt-16 z-10">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 lg:items-start">

          {/* ── Sidebar ── */}
          <div className="lg:sticky lg:top-20 space-y-4">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden flex items-center justify-center shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={`Foto de perfil de ${user.fullName || 'usuário'}`} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
                )}
              </div>
            </div>

            {/* Name & badges */}
            <motion.div {...fade} className="text-center">
              <h1 className="text-base font-bold text-[#111] leading-tight font-[family-name:var(--font-heading)]">
                {user.fullName || 'Usuário'}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F0F0F0] text-[#555]">
                  Vendedor
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E8F5E9] text-[#2E7D32]">
                  Verificado
                </span>
              </div>
              <p className="text-sm text-[#888] mt-2">Carros usados e seminovos</p>
            </motion.div>

            {/* Stats */}
            {stats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1, ease }}
                className="grid grid-cols-2 gap-3"
              >
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-center flex flex-col items-center"
                  >
                    <stat.icon className="w-5 h-5 mb-2 text-[#888]" strokeWidth={1.75} />
                    <p className="text-lg font-bold text-[#111] leading-none">{stat.value}</p>
                    <p className="text-xs text-[#999] font-medium mt-1">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15, ease }}
              className="flex items-center justify-center gap-3"
            >
              <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#111] text-white text-sm font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:bg-[#333] transition-colors min-h-[44px]">
                <User className="w-4 h-4" strokeWidth={2} />
                Editar Perfil
              </button>
              <button aria-label="Configurações" onClick={() => router.push('/minha-conta/configuracoes')} className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-gray-50 transition-colors">
                <Settings className="w-5 h-5 text-[#555]" strokeWidth={1.75} />
              </button>
              <button aria-label="Notificações" onClick={() => router.push('/minha-conta/notificacoes')} className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-gray-50 transition-colors">
                <Bell className="w-5 h-5 text-[#555]" strokeWidth={1.75} />
              </button>
            </motion.div>

            {/* Mobile nav */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2, ease }}
            >
              <div className="relative lg:hidden">
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[44px] ${
                        isActive(item.href)
                          ? 'bg-[#111] text-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
                          : 'bg-white text-[#666] border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <item.icon className="w-4 h-4" strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#F7F7F7] to-transparent pointer-events-none" />
              </div>

              {/* Desktop nav */}
              <div className="hidden lg:flex flex-col gap-1">
                {navItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all min-h-[44px] ${
                        active
                          ? 'bg-[#111] text-white font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
                          : 'text-[#666] hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                      }`}
                    >
                      <item.icon className="w-5 h-5" strokeWidth={1.75} />
                      {item.label}
                      {active && (
                        <motion.div
                          layoutId="nav-active"
                          className="ml-auto w-2 h-2 rounded-full bg-white"
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </div>

          {/* ── Main content ── */}
          <div className="space-y-4 mt-4 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease }}
              className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(0,0,0,0.05)] p-5 sm:p-7"
            >
              {children}
            </motion.div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-5 py-3 rounded-full text-sm text-[#999] hover:text-[#E53935] hover:bg-red-50 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                {loggingOut ? 'Saindo...' : 'Sair da conta'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
