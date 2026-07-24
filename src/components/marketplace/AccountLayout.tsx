'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
  LayoutDashboard, Car, MessageCircle, Bell, Settings,
  LogOut, User, Heart, ChevronRight
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

const navItems = [
  { href: '/minha-conta', label: 'Início', icon: LayoutDashboard },
  { href: '/minha-conta/anuncios', label: 'Meus anúncios', icon: Car },
  { href: '/minha-conta/conversas', label: 'Mensagens', icon: MessageCircle },
  { href: '/minha-conta/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/minha-conta/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/minha-conta/configuracoes', label: 'Configurações', icon: Settings },
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
    <div className="min-h-dvh bg-gray-50 pb-28 lg:pb-0">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span className="text-lg font-bold text-gray-900 hidden sm:block">Carbi</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              aria-label="Configurações"
              onClick={() => router.push('/minha-conta/configuracoes')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
            >
              <Settings className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm ml-1">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-blue-600" strokeWidth={2} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 lg:py-12">
        {/* Desktop: Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="hidden lg:block mb-12"
        >
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Olá, {user.fullName?.split(' ')[0] || 'Usuário'} 👋
              </h1>
              <p className="text-base text-gray-500 mt-2">Gerencie sua conta e anúncios</p>
            </div>
            {stats.length > 0 && (
              <div className="flex items-center gap-5">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl px-6 py-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                        <stat.icon className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-gray-900 block leading-none">{stat.value}</span>
                        <span className="text-xs text-gray-500 mt-1 block">{stat.label}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12 lg:items-start">

          {/* ── Sidebar ── */}
          <div className="lg:sticky lg:top-28 space-y-5 mb-8 lg:mb-0">
            {/* User Info Card - Desktop */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
              className="hidden lg:block bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0 border-4 border-white shadow-md">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-blue-600" strokeWidth={1.5} />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 truncate">
                    {user.fullName || 'Usuário'}
                  </h2>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{user.email}</p>
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
              <div className="lg:hidden flex gap-2.5 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none">
                {navItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition-all ${
                        active
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-500'}`} strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>

              {/* Desktop: card list */}
              <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {navItems.map((item, index) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-4 px-5 py-4 text-sm font-medium transition-all ${
                        active
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                      } ${index < navItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <item.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} strokeWidth={1.75} />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-gray-300'}`} />
                    </Link>
                  )
                })}
              </div>
            </motion.nav>

            {/* Logout - Desktop only */}
            <div className="hidden lg:block pt-2">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-50 border border-gray-200 hover:border-red-200"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
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
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-pb">
        <div className="flex items-center justify-around px-3 py-3">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all min-w-0 ${
                  active ? 'text-blue-600 bg-blue-50' : 'text-gray-400'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} strokeWidth={active ? 2.5 : 1.75} />
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
