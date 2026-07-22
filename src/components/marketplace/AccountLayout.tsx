'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { LayoutDashboard, Car, MessageCircle, Bell, Settings, LogOut, User } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

const navItems = [
  { href: '/minha-conta', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/minha-conta/anuncios', label: 'Meus anúncios', icon: Car },
  { href: '/minha-conta/conversas', label: 'Mensagens', icon: MessageCircle },
  { href: '/minha-conta/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/minha-conta/configuracoes', label: 'Configurações', icon: Settings },
]

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } }

interface AccountLayoutProps {
  children: React.ReactNode
  user: { email: string; fullName: string; avatarUrl: string }
}

export default function AccountLayout({ children, user }: AccountLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const isActive = (href: string) => href === '/minha-conta' ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await getSupabaseBrowserClient().auth.signOut()
      router.replace('/')
    } catch { setLoggingOut(false) }
  }

  const navLink = (item: typeof navItems[number]) => {
    const active = isActive(item.href)
    return (
      <Link key={item.href} href={item.href}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
          active ? 'bg-[var(--color-accent)]/15 text-[var(--color-text-primary)] font-semibold'
            : 'text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text-primary)]'
        }`}>
        <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        {item.label}
        {active && <motion.div layoutId="sidebar-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-text-primary)]" />}
      </Link>
    )
  }

  return (
    <div className="min-h-screen pb-16 pt-28 px-4 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Mobile tabs */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive(item.href) ? 'bg-[var(--color-accent)]/15 text-[var(--color-text-primary)] font-semibold'
                  : 'bg-white border border-gray-200 text-[var(--color-text-secondary)] hover:border-gray-300'
              }`}>
              <item.icon className="w-4 h-4" strokeWidth={1.75} />{item.label}
            </Link>
          ))}
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <div className="sticky top-28 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : <User className="w-8 h-8 text-gray-300" strokeWidth={1.5} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{user.fullName || 'Usuário'}</p>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.email}</p>
              </div>
            </div>
            <nav className="space-y-1">{navItems.map(navLink)}</nav>
            <div className="mt-5 pt-4 border-t border-gray-100">
              <button type="button" onClick={handleLogout} disabled={loggingOut}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-[var(--color-danger)] hover:bg-red-50 transition-colors w-full disabled:opacity-50">
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                {loggingOut ? 'Saindo...' : 'Sair da conta'}
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <motion.div {...fade}>{children}</motion.div>
        </main>
      </div>
    </div>
  )
}
