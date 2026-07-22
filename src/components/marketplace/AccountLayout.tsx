'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
  LayoutDashboard, Car, Heart, MessageCircle, Bell, Settings, LogOut, User,
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import ProfilePanel from '@/components/marketplace/ProfilePanel'

const navItems = [
  { href: '/minha-conta', label: 'Painel', icon: LayoutDashboard },
  { href: '/minha-conta/anuncios', label: 'Meus anúncios', icon: Car },
  { href: '/minha-conta/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/minha-conta/conversas', label: 'Mensagens', icon: MessageCircle },
  { href: '/minha-conta/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/minha-conta/configuracoes', label: 'Configurações', icon: Settings },
]

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
}

export default function AccountLayout({ user }: { user: { email: string; fullName: string; avatarUrl: string } }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      router.replace('/')
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen pb-16 pt-28 px-4 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* ── Sidebar ── */}
        <aside className="lg:w-64 shrink-0">
          {/* Mobile: horizontal tabs */}
          <div className="lg:hidden flex gap-2 mb-4 overflow-x-auto pb-2">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-[var(--color-accent)] text-[var(--color-text-primary)] font-semibold'
                      : 'bg-white border border-gray-200 text-[var(--color-text-secondary)] hover:border-gray-300'
                  }`}>
                  <item.icon className="w-4 h-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop: sticky sidebar */}
          <div className="hidden lg:block sticky top-28">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              {/* User info */}
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{user.fullName || 'Usuário'}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.email}</p>
                </div>
              </div>

              {/* Nav links */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                        active
                          ? 'bg-[var(--color-accent)]/30 text-[var(--color-text-primary)] font-semibold'
                          : 'text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text-primary)]'
                      }`}>
                      <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      {item.label}
                      {active && (
                        <motion.div layoutId="sidebar-indicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-text-primary)]" />
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Logout */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5 transition-colors w-full disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.75} />
                  {loggingOut ? 'Saindo...' : 'Sair da conta'}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0">
          <motion.div {...fade}>
            <ProfilePanel />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
