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
    <div className="min-h-dvh bg-[#F8F9FA]">
      {/* Top Command Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Logo + Search */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
                <span className="text-[#D4F576] text-sm font-bold">C</span>
              </div>
              <span className="text-lg font-bold text-[#1A1A1A] hidden sm:block tracking-tight">Carbi</span>
            </Link>
            
            {/* Command Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-500 transition-colors ml-4"
            >
              <Search className="w-4 h-4" />
              <span>Buscar...</span>
              <kbd className="ml-2 px-1.5 py-0.5 bg-white rounded text-[10px] font-mono text-gray-400 border border-gray-200">⌘K</kbd>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/minha-conta/anuncios')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-[#D4F576] rounded-xl text-sm font-semibold hover:bg-[#2D2D2D] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo anúncio
            </button>
            
            <button
              aria-label="Notificações"
              onClick={() => router.push('/minha-conta/notificacoes')}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
            >
              <Bell className="w-5 h-5" strokeWidth={1.75} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF6B52] rounded-full" />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] overflow-hidden flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-[#D4F576]" strokeWidth={2} />
                )}
              </div>
              <span className="text-sm font-medium text-[#1A1A1A] hidden sm:block">{user.fullName?.split(' ')[0] || 'Usuário'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all min-w-0 ${
                  active ? 'bg-[#1A1A1A] text-[#D4F576]' : 'text-gray-400'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-[#D4F576]' : 'text-gray-400'}`} strokeWidth={active ? 2.5 : 1.75} />
                <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Layout */}
      <div className="max-w-[1400px] mx-auto">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:min-h-[calc(100vh-64px)]">
          
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block border-r border-gray-100 bg-white/50 p-6">
            <div className="sticky top-24 space-y-8">
              {/* User Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-[#1A1A1A] overflow-hidden flex items-center justify-center mx-auto mb-4">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-[#D4F576]" strokeWidth={1.5} />
                  )}
                </div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">{user.fullName || 'Usuário'}</h2>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                {user.phone ? <p className="text-sm text-gray-500 mt-1">{user.phone}</p> : null}
              </motion.div>

              {/* Navigation */}
              <nav className="space-y-1">
                {navItems.map((item, index) => {
                  const active = isActive(item.href)
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05, ease }}
                    >
                      <Link
                        href={item.href}
                        className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          active
                            ? 'bg-[#1A1A1A] text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-[#1A1A1A]'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${active ? 'text-[#D4F576]' : 'text-gray-400 group-hover:text-[#1A1A1A]'}`} strokeWidth={1.75} />
                        <div className="flex-1">
                          <span className="text-sm font-semibold block">{item.label}</span>
                          <span className={`text-[11px] ${active ? 'text-gray-400' : 'text-gray-400'}`}>{item.description}</span>
                        </div>
                        {active && <ChevronRight className="w-4 h-4 text-[#D4F576]" />}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              {/* Logout */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-[#DC2626] hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.75} />
                  {loggingOut ? 'Saindo...' : 'Sair da conta'}
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="px-2 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-32 lg:pb-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
            >
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
              className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar anúncios, configurações..."
                  className="flex-1 text-base text-[#1A1A1A] placeholder-gray-400 focus:outline-none"
                />
                <button onClick={() => setSearchOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Acesso rápido</p>
                <div className="space-y-2">
                  {navItems.slice(0, 4).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <item.icon className="w-5 h-5 text-gray-400" strokeWidth={1.75} />
                      <div>
                        <span className="text-sm font-medium text-[#1A1A1A]">{item.label}</span>
                        <span className="text-xs text-gray-400 ml-2">{item.description}</span>
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
              className="fixed top-16 right-4 sm:right-8 z-[95] w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] overflow-hidden flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-[#D4F576]" strokeWidth={2} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{user.fullName || 'Usuário'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    {user.phone ? <p className="text-xs text-gray-500">{user.phone}</p> : null}
                  </div>
                </div>
              </div>
              <div className="p-2">
                <Link
                  href="/minha-conta"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
                  <span className="text-sm text-gray-700">Meu perfil</span>
                </Link>
                <Link
                  href="/minha-conta/configuracoes"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
                  <span className="text-sm text-gray-700">Configurações</span>
                </Link>
                <div className="my-2 border-t border-gray-100" />
                <button
                  onClick={() => { setSidebarOpen(false); handleLogout() }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 text-[#DC2626] transition-colors"
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
