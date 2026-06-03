'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, Search, CarFront, Sparkles, ChevronRight, MessageCircle, LayoutDashboard, UserRound, LogOut, ShoppingBag, Tag, Truck, Home, Heart } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

const BOTTOM_NAV = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/carros-a-venda', label: 'Comprar', icon: Search },
  { href: '/anunciar-carro', label: 'Vender', icon: Tag },
  { href: '/marcas', label: 'Marcas', icon: CarFront },
]

export default function Navbar() {
  const router = useRouter()
  const supabaseReady = isSupabaseBrowserConfigured()
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const pathname = usePathname()
  const searchRef = useRef<HTMLInputElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handle, { passive: true })
    handle()
    return () => window.removeEventListener('scroll', handle)
  }, [])

  useEffect(() => {
    setDrawerOpen(false)
    setSearchOpen(false)
    setAccountOpen(false)
  }, [pathname])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 80)
  }, [searchOpen])

  useEffect(() => {
    if (!supabaseReady) {
      setSessionReady(true)
      setIsAuthenticated(false)
      setUserEmail('')
      return
    }

    let unsubscribe: (() => void) | null = null

    const boot = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session)
      setUserEmail(data.session?.user?.email || '')
      setSessionReady(true)

      const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session)
        setUserEmail(session?.user?.email || '')
      })
      unsubscribe = () => authData.subscription.unsubscribe()
    }

    void boot()
    return () => unsubscribe?.()
  }, [supabaseReady])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!accountRef.current) return
      if (accountRef.current.contains(event.target as Node)) return
      setAccountOpen(false)
    }

    if (accountOpen) {
      document.addEventListener('mousedown', onClickOutside)
    }
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [accountOpen])

  const navLinks = [
    { href: '/carros-a-venda', label: 'Comprar', icon: ShoppingBag, desc: 'Explore anúncios' },
    { href: '/caminhoes', label: 'Caminhões', icon: Truck, desc: 'Veículos pesados' },
    { href: '/anunciar-carro', label: 'Vender', icon: Tag, desc: 'Anuncie grátis' },
    { href: '/marcas', label: 'Marcas', icon: CarFront, desc: 'Navegue por marca' },
  ]

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const query = searchTerm.trim()
    setSearchOpen(false)
    if (!query) {
      router.push('/carros-a-venda')
      return
    }
    router.push(`/carros-a-venda?q=${encodeURIComponent(query)}`)
  }

  const handleSignOut = async () => {
    if (!supabaseReady) return
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    setAccountOpen(false)
    setDrawerOpen(false)
    router.push('/entrar')
  }

  const userLabel = userEmail ? userEmail.split('@')[0] : 'Minha conta'
  const isHome = pathname === '/'
  const showScrolled = scrolled || !isHome

  return (
    <>
      {/* ── TOP NAVBAR ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          showScrolled
            ? 'bg-white border-b border-border shadow-xs'
            : 'bg-transparent'
        }`}
        style={{ height: 'var(--navbar-height)' }}
      >
        <div className="container h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="font-display text-2xl text-text-primary hover:opacity-70 transition-opacity"
          >
            carbi
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    active
                      ? 'bg-bg-alt text-text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-alt'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="btn-icon hidden md:flex"
              aria-label="Buscar"
            >
              <Search className="w-4 h-4" />
            </button>

            {sessionReady ? (
              isAuthenticated ? (
                <div className="relative hidden md:block" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen((prev) => !prev)}
                    className="btn-sm btn-secondary"
                  >
                    <UserRound className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">{userLabel}</span>
                  </button>

                  {accountOpen && (
                    <div className="absolute right-0 top-12 w-56 card-elevated p-1.5 animate-scale-in z-50">
                      <Link href="/minha-conta" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-alt transition-colors">
                        <UserRound className="w-4 h-4" /> Meu perfil
                      </Link>
                      <Link href="/minha-conta/anuncios" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-alt transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Meus anúncios
                      </Link>
                      <Link href="/minha-conta/conversas" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-alt transition-colors">
                        <MessageCircle className="w-4 h-4" /> Meus chats
                      </Link>
                      <div className="divider my-1" />
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sair
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/entrar"
                  className="hidden md:inline-flex btn-sm btn-secondary"
                >
                  <UserRound className="w-4 h-4" />
                  Entrar
                </Link>
              )
            ) : null}

            <button
              onClick={() => setDrawerOpen(true)}
              className="btn-icon md:hidden"
              aria-label="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="hidden md:inline-flex btn-sm btn-primary"
            >
              <Menu className="w-4 h-4" />
              Menu
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-around h-14">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-h-0 ${
                  active ? 'text-text-primary' : 'text-text-tertiary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold leading-none">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg text-text-tertiary transition-colors min-h-0"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-semibold leading-none">Buscar</span>
          </button>
        </div>
      </nav>

      {/* ── SEARCH OVERLAY ── */}
      {searchOpen && (
        <div className="fixed inset-0 z-[1000] bg-white/98 animate-fade-in flex flex-col items-center pt-24 px-6">
          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-heading font-bold">O que você procura?</h2>
              <button
                onClick={() => setSearchOpen(false)}
                className="btn-icon"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSearchSubmit} className="mb-8">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Marca, modelo ou palavra-chave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-lg pl-14"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg w-full mt-4"
              >
                Pesquisar Veículos
              </button>
            </form>
            <div>
              <p className="label mb-3">Buscas frequentes</p>
              <div className="flex flex-wrap gap-2">
                {['SUV', 'Elétrico', 'Hatch', 'Sedan', 'Picape', 'Até R$ 50k'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      router.push(`/carros-a-venda?q=${encodeURIComponent(s)}`)
                      setSearchOpen(false)
                    }}
                    className="badge badge-neutral cursor-pointer hover:bg-accent hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER MENU ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-end">
          <div
            className="absolute inset-0 bg-black/20 animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative w-full max-w-md h-full bg-[#FAFAF5] shadow-2xl p-6 flex flex-col animate-slide-in-right overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="font-display text-2xl text-text-primary">
                carbi
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="btn-icon bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account Section */}
            <div className="card p-4 mb-6">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <p className="label">Minha Conta</p>
                  <p className="text-sm font-semibold text-text-primary truncate">{userEmail}</p>
                  <div className="flex gap-2">
                    <Link href="/minha-conta" className="btn-sm btn-primary">
                      Painel
                    </Link>
                    <button onClick={handleSignOut} className="btn-sm btn-ghost text-danger">
                      Sair
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="label">Minha Conta</p>
                  <p className="text-sm text-text-secondary">Faça login para gerenciar seus anúncios.</p>
                  <Link href="/entrar" className="btn-sm btn-primary inline-flex">
                    Entrar na plataforma
                  </Link>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col gap-1.5 mb-8">
              {navLinks.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${
                      active
                        ? 'bg-accent text-white'
                        : 'text-text-secondary hover:bg-white hover:text-text-primary'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      active ? 'bg-white/20 text-white' : 'bg-bg-alt text-text-secondary'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{link.label}</p>
                      <p className={`text-xs ${active ? 'text-white/60' : 'text-text-tertiary'}`}>{link.desc}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${active ? 'text-white/40' : 'text-text-tertiary'} group-hover:translate-x-0.5 transition-transform`} />
                  </Link>
                )
              })}
            </nav>

            {/* Bottom CTA */}
            <div className="mt-auto pt-6 border-t border-border">
              <Link
                href="/qual-carro"
                className="group flex items-center justify-between p-4 bg-accent text-white rounded-xl hover:bg-black transition-all"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-white/70" />
                  <span className="text-sm font-semibold">Descobrir meu carro ideal</span>
                </div>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className="text-center text-xs text-text-tertiary mt-4">
                carbi &copy; 2026 &mdash; Premium Automotive
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
