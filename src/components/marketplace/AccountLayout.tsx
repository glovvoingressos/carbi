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
    <div className="min-h-dvh bg-[#F5F5F5] pb-20 fingen-shell">
      {/* Hero banner */}
      <div className="relative h-44 md:h-52 bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#111111] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#D4F576_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F5] via-[#F5F5F5]/40 to-transparent" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 -mt-20 z-10">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8 lg:items-start space-y-6 lg:space-y-0">

          {/* ── Sidebar ── */}
          <div className="lg:sticky lg:top-20 space-y-5">
            {/* User Profile Card */}
            <div className="bg-white rounded-[24px] p-6 border border-gray-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center space-y-4">
              {/* Avatar */}
              <div className="relative flex justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden flex items-center justify-center shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={`Foto de perfil de ${user.fullName || 'usuário'}`} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                  )}
                </div>
              </div>

              {/* Name & badges */}
              <motion.div {...fade}>
                <h1 className="text-lg font-bold text-[#1A1A1A] leading-tight font-[family-name:var(--font-heading)]">
                  {user.fullName || 'Usuário'}
                </h1>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                    Vendedor
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-[#D4F576]/30 text-gray-900 border border-[#D4F576]">
                    ✓ Verificado
                  </span>
                </div>
              </motion.div>

              {/* Stats */}
              {stats.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1, ease }}
                  className="grid grid-cols-2 gap-2.5 pt-2 border-t border-gray-100"
                >
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-gray-50/80 rounded-2xl p-3 text-center flex flex-col items-center border border-gray-100"
                    >
                      <stat.icon className="w-4 h-4 mb-1 text-gray-500" strokeWidth={1.75} />
                      <p className="text-base font-bold text-[#1A1A1A] leading-none font-[family-name:var(--font-heading)]">{stat.value}</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-1">{stat.label}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => router.push('/minha-conta')} className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-black transition-colors shadow-sm">
                  <User className="w-3.5 h-3.5 text-[#D4F576]" strokeWidth={2} />
                  Perfil
                </button>
                <button aria-label="Configurações" onClick={() => router.push('/minha-conta/configuracoes')} className="w-11 h-11 rounded-full bg-gray-100 border border-gray-200/80 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0">
                  <Settings className="w-4 h-4 text-gray-700" strokeWidth={1.75} />
                </button>
                <button aria-label="Notificações" onClick={() => router.push('/minha-conta/notificacoes')} className="w-11 h-11 rounded-full bg-gray-100 border border-gray-200/80 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0">
                  <Bell className="w-4 h-4 text-gray-700" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Mobile Nav Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2, ease }}
            >
              <div className="relative lg:hidden">
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all min-h-[44px] ${
                        isActive(item.href)
                          ? 'bg-[#1A1A1A] text-[#D4F576] shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Desktop Nav Sidebar */}
              <div className="hidden lg:flex flex-col gap-1.5 bg-white p-2 rounded-[24px] border border-gray-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                {navItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all min-h-[44px] ${
                        active
                          ? 'bg-[#1A1A1A] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${active ? 'text-[#D4F576]' : 'text-gray-500'}`} strokeWidth={1.75} />
                      {item.label}
                      {active && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-[#D4F576]" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </div>

          {/* ── Main content ── */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease }}
              className="bg-white rounded-[24px] border border-gray-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-5 sm:p-7"
            >
              {children}
            </motion.div>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 min-h-[44px]"
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
