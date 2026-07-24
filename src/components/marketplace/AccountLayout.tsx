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
    <div className="min-h-dvh bg-gray-50 pb-24 lg:pb-0">
      {/* Top bar - iFood style */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-base font-bold text-gray-900">Carbi</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              aria-label="Configurações"
              onClick={() => router.push('/minha-conta/configuracoes')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
            >
              <Settings className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-blue-600" strokeWidth={2} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        {/* Desktop: Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="hidden lg:block mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Olá, {user.fullName?.split(' ')[0] || 'Usuário'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Gerencie sua conta e anúncios</p>
            </div>
            {stats.length > 0 && (
              <div className="flex items-center gap-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl px-6 py-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <stat.icon className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
                      <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 lg:items-start">

          {/* ── Sidebar ── */}
          <div className="lg:sticky lg:top-24 space-y-4 mb-6 lg:mb-0">
            {/* User Info Card - Desktop */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
              className="hidden lg:block bg-white rounded-2xl border border-gray-200 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900 truncate">
                    {user.fullName || 'Usuário'}
                  </h2>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                </div>
              </div>
            </motion.div>

            {/* Navigation - iFood style */}
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
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        active
                          ? 'bg-blue-600 text-white'
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
              <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {navItems.map((item, index) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all ${
                        active
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                      } ${index < navItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <item.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} strokeWidth={1.75} />
                      {item.label}
                      <ChevronRight className={`w-4 h-4 ml-auto ${active ? 'text-blue-400' : 'text-gray-300'}`} />
                    </Link>
                  )
                })}
              </div>
            </motion.nav>

            {/* Logout - Desktop only */}
            <div className="hidden lg:block">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
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

      {/* ── Mobile Bottom Navigation - iFood style ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-0 ${
                  active ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-500'}`} strokeWidth={active ? 2.5 : 1.75} />
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
