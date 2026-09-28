'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard, Car, MessageCircle, Bell, Settings,
  LogOut, User, Heart, ChevronRight, Search, X, Plus,
  BarChart3, TrendingUp, Eye, Star, Shield
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

const navItems = [
  { href: '/minha-conta', label: 'Dashboard', icon: LayoutDashboard, description: 'Visão geral' },
  { href: '/minha-conta/anuncios', label: 'Anúncios', icon: Car, description: 'Gerenciar veículos' },
  { href: '/minha-conta/conversas', label: 'Mensagens', icon: MessageCircle, description: 'Chat com compradores' },
  { href: '/minha-conta/favoritos', label: 'Favoritos', icon: Heart, description: 'Veículos salvos' },
  { href: '/minha-conta/buscas', label: 'Minhas buscas', icon: Search, description: 'Procure Meu Carro' },
  { href: '/minha-conta/notificacoes', label: 'Alertas', icon: Bell, description: 'Notificações' },
  { href: '/minha-conta/configuracoes', label: 'Configurações', icon: Settings, description: 'Conta e preferências' },
]

const ease = [0.23, 1, 0.32, 1] as const

interface AccountLayoutProps {
  children: React.ReactNode
  user: { email: string; fullName: string; avatarUrl: string; phone?: string }
  stats?: { label: string; value: string | number; icon: any }[]
}

export default function AccountLayout({ children, user, stats = [] }: AccountLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

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

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className="member-shell min-h-dvh text-[14px] md:text-[15px] text-[#0A0A0A]">
      <header className="account-header sticky top-0 z-50 border-b bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#00A36A]">
                <span className="text-[14px] font-bold text-[#0A0A0A]">C</span>
              </div>
              <div className="hidden leading-none sm:block">
                <span className="block text-[14px] font-bold tracking-[-0.04em] md:text-[15px]">carbi.</span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5C5C66]">member space</span>
              </div>
            </Link>

            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar na sua conta"
              className="account-search-button hidden min-w-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors md:flex lg:ml-4 lg:w-72"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">Buscar anúncios, veículos...</span>
              <kbd className="ml-auto shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-mono text-[#5C5C66]">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/minha-conta/anuncios')}
              className="account-primary-action hidden items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-transform hover:-translate-y-0.5 sm:flex"
            >
              <Plus className="h-4 w-4" />
              Novo anúncio
            </button>
            <button
              aria-label="Notificações"
              onClick={() => router.push('/minha-conta/notificacoes')}
              className="account-icon-button relative flex h-10 w-10 items-center justify-center rounded-full border bg-white text-black transition-colors"
            >
              <Bell className="h-4 w-4" strokeWidth={1.8} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#B8FF00] ring-2 ring-white" />
            </button>
            <div className="mx-1 hidden h-6 w-px bg-black/10 sm:block" />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="account-profile-toggle flex items-center gap-2 rounded-full p-1 transition-colors"
              aria-label={sidebarOpen ? 'Fechar menu da conta' : 'Abrir menu da conta'}
              aria-expanded={sidebarOpen}
              aria-controls="account-user-menu"
            >
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#00A36A]">
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-[#0A0A0A]" strokeWidth={2} />}
              </div>
              <span className="hidden max-w-24 truncate pr-2 text-sm font-semibold sm:block">{user.fullName?.split(' ')[0] || 'Usuário'}</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="account-bottom-nav safe-area-pb fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 backdrop-blur-xl lg:hidden" aria-label="Navegação da conta">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-full px-3 py-2 transition-all ${active ? 'bg-[#00A36A] text-[#0A0A0A]' : 'text-[#5C5C66]'}`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-[#B8FF00]' : 'text-[#5C5C66]'}`} strokeWidth={active ? 2.4 : 1.75} />
                <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="mx-auto max-w-[1500px]">
        <div className="lg:grid lg:min-h-[calc(100vh-64px)] lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="account-sidebar hidden border-r bg-white/60 p-4 lg:block">
            <div className="sticky top-24 space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="account-user-card rounded-[24px] p-4 text-white"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#B8FF00] text-[#0A0A0A]">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : <User className="h-5 w-5" strokeWidth={2} />}
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#B8FF00]">Carbi ID</span>
                </div>
                <p className="truncate text-[14px] font-bold md:text-[15px]">{user.fullName || 'Usuário'}</p>
                <p className="mt-1 truncate text-xs text-white/70">{user.email}</p>
                <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-3 text-[10px] uppercase tracking-[0.14em] text-white/70">
                  <span>Conta ativa</span>
                  <span className="h-2 w-2 rounded-full bg-[#B8FF00]" />
                </div>
              </motion.div>

              <nav className="account-side-nav space-y-1.5" aria-label="Menu da conta">
                {navItems.map((item, index) => {
                  const active = isActive(item.href)
                  return (
                    <motion.div key={item.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.05, ease }}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={`group flex items-center gap-3 rounded-[16px] px-3 py-3 transition-all ${active ? 'bg-[#00A36A] text-[#0A0A0A]' : 'text-[#3F3F47] hover:bg-black/[0.04] hover:text-[#0A0A0A]'}`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#0A0A0A]' : 'text-[#5C5C66] group-hover:text-[#0A0A0A]'}`} strokeWidth={active ? 2.4 : 1.75} />
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{item.label}</span>
                          <span className={`block truncate text-[11px] ${active ? 'text-[#304000]' : 'text-[#5C5C66]'}`}>{item.description}</span>
                        </div>
                        {active && <ChevronRight className="h-4 w-4 shrink-0" />}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              <div className="border-t border-black/[0.06] pt-3">
                <button type="button" onClick={handleLogout} disabled={loggingOut} className="flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-sm font-medium text-[#5C5C66] transition-colors hover:bg-[#FFF0EE] hover:text-[#D94A3A] disabled:opacity-50">
                  <LogOut className="h-4 w-4" strokeWidth={1.75} />
                  {loggingOut ? 'Saindo...' : 'Sair da conta'}
                </button>
              </div>
            </div>
          </aside>

          <main className="account-main min-w-0 px-3 py-4 pb-28 sm:px-6 sm:py-6 lg:px-8 lg:py-8 lg:pb-8">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="min-w-0">
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease }}
              className="w-full max-w-xl mx-4 overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-4">
                <Search className="h-5 w-5 text-[#5C5C66]" />
                <input
                  autoFocus
                  type="text"
                  aria-label="Buscar anúncios e configurações"
                  placeholder="Buscar anúncios, configurações..."
                  className="flex-1 text-[14px] md:text-[15px] text-[#0A0A0A] placeholder-[#6A6A74] focus:outline-none"
                />
                <button aria-label="Fechar busca" onClick={() => setSearchOpen(false)} className="rounded-full p-1.5 transition-colors hover:bg-[#F1F1F6]">
                  <X className="h-5 w-5 text-[#5C5C66]" />
                </button>
              </div>
              <div className="p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5C5C66]">Acesso rápido</p>
                <div className="space-y-2">
                  {navItems.slice(0, 4).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 rounded-[16px] px-4 py-3 transition-colors hover:bg-[#F1F1F6]"
                    >
                      <item.icon className="h-5 w-5 text-[#5C5C66]" strokeWidth={1.75} />
                      <div>
                        <span className="text-sm font-medium text-[#0A0A0A]">{item.label}</span>
                        <span className="ml-2 text-xs text-[#5C5C66]">{item.description}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Menu Dropdown */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease }}
              id="account-user-menu"
              role="dialog"
              aria-label="Menu da conta"
              className="account-user-menu fixed right-4 top-16 z-[95] w-72 overflow-hidden rounded-[24px] border bg-white shadow-2xl sm:right-8"
            >
              <div className="border-b border-black/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#00A36A]">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-[#0A0A0A]" strokeWidth={2} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0A0A0A]">{user.fullName || 'Usuário'}</p>
                    <p className="text-xs text-[#5C5C66]">{user.email}</p>
                    {user.phone ? <p className="text-xs text-[#5C5C66]">{user.phone}</p> : null}
                  </div>
                </div>
              </div>
              <div className="p-2">
                <Link
                  href="/minha-conta"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-[16px] px-4 py-2.5 transition-colors hover:bg-[#F1F1F6]"
                >
                  <User className="h-4 w-4 text-[#5C5C66]" strokeWidth={1.75} />
                  <span className="text-sm text-[#3F3F47]">Meu perfil</span>
                </Link>
                <Link
                  href="/minha-conta/configuracoes"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-[16px] px-4 py-2.5 transition-colors hover:bg-[#F1F1F6]"
                >
                  <Settings className="h-4 w-4 text-[#5C5C66]" strokeWidth={1.75} />
                  <span className="text-sm text-[#3F3F47]">Configurações</span>
                </Link>
                <div className="my-2 border-t border-black/[0.06]" />
                <button
                  onClick={() => { setSidebarOpen(false); handleLogout() }}
                  className="flex w-full items-center gap-3 rounded-[16px] px-4 py-2.5 text-[#D94A3A] transition-colors hover:bg-[#FFF0EE]"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.75} />
                  <span className="text-sm font-medium">Sair da conta</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
