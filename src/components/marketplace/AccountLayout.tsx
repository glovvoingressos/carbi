'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
  LayoutDashboard, Car, MessageCircle, Bell, Settings,
  LogOut, User, Heart
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

const navItems = [
  { href: '/minha-conta', label: 'Início', icon: LayoutDashboard },
  { href: '/minha-conta/anuncios', label: 'Anúncios', icon: Car },
  { href: '/minha-conta/conversas', label: 'Chat', icon: MessageCircle },
  { href: '/minha-conta/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/minha-conta/notificacoes', label: 'Alertas', icon: Bell },
  { href: '/minha-conta/configuracoes', label: 'Config', icon: Settings },
]

const ease = [0.23, 1, 0.32, 1] as const

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
    <div className="min-h-dvh bg-[#FAFAFA] pb-24 lg:pb-0">
      {/* Minimal top bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-[#1A1A1A] tracking-tight">
            Carbi
          </Link>
          <div className="flex items-center gap-1">
            <button
              aria-label="Configurações"
              onClick={() => router.push('/minha-conta/configuracoes')}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
            >
              <Settings className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center ml-1">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-500" strokeWidth={2} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Desktop: Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="hidden lg:block mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#1A1A1A]">
                Olá, {user.fullName?.split(' ')[0] || 'Usuário'}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">Gerencie sua conta e anúncios</p>
            </div>
            {stats.length > 0 && (
              <div className="flex items-center gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <stat.icon className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
                      <span className="text-lg font-bold text-[#1A1A1A]">{stat.value}</span>
                    </div>
                    <span className="text-xs text-gray-400">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12 lg:items-start">

          {/* ── Sidebar ── */}
          <div className="lg:sticky lg:top-24 space-y-6 mb-6 lg:mb-0">
            {/* User Info Card - Desktop */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
              className="hidden lg:block bg-white rounded-2xl border border-gray-100 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[#1A1A1A] truncate">
                    {user.fullName || 'Usuário'}
                  </h2>
                  <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            <motion.nav
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1, ease }}
            >
              {/* Mobile: horizontal scroll */}
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                {navItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        active
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className={`w-3.5 h-3.5 ${active ? 'text-[#D4F576]' : 'text-gray-400'}`} strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>

              {/* Desktop: vertical list */}
              <div className="hidden lg:flex flex-col gap-0.5">
                {navItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${active ? 'text-[#D4F576]' : 'text-gray-400'}`} strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </motion.nav>

            {/* Logout - Desktop only */}
            <div className="hidden lg:block pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                {loggingOut ? 'Saindo...' : 'Sair da conta'}
              </button>
            </div>
          </div>

          {/* ── Main content ── */}
          <motion.main
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease }}
            className="min-h-[60vh]"
          >
            {children}
          </motion.main>

        </div>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0 ${
                  active ? 'text-[#1A1A1A]' : 'text-gray-400'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-[#1A1A1A]' : 'text-gray-400'}`} strokeWidth={active ? 2 : 1.75} />
                <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
