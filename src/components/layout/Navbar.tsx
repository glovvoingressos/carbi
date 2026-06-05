'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  Menu, X, Search, CarFront, Sparkles, ChevronRight,
  MessageCircle, LayoutDashboard, UserRound, LogOut,
  ShoppingBag, Tag, Home,
} from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

const BOTTOM_NAV = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/carros-a-venda', label: 'Buscar', icon: Search },
  { href: '/anunciar-carro', label: 'Anunciar', icon: Tag },
  { href: '/marcas', label: 'Marcas', icon: CarFront },
]

const PRIMARY_NAV = [
  { href: '/carros-a-venda', label: 'Comprar' },
  { href: '/anunciar-carro', label: 'Vender' },
  { href: '/marcas', label: 'Marcas' },
  { href: '/qual-carro', label: 'Qual carro?' },
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
    const handle = () => setScrolled(window.scrollY > 12)
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

  useEffect(() => {
    if (drawerOpen || searchOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen, searchOpen])

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
    router.push('/')
  }

  const userLabel = userEmail ? userEmail.split('@')[0] : 'Entrar'
  const isHome = pathname === '/'

  return (
    <>
      {/* ── TOP NAV ── */}
      <header
        className="fixed left-0 right-0 top-0 z-50 px-3 py-4 transition-all duration-300"
        style={{ height: 'var(--navbar-height)' }}
      >
        <div className={`container flex h-full items-center justify-between rounded-full border-2 border-[#17170F]/10 bg-[#FFFDF3]/92 px-4 shadow-sm backdrop-blur-2xl transition-all duration-300 md:px-5 ${
          scrolled || !isHome ? 'shadow-[0_12px_40px_rgba(23,23,15,0.08)]' : ''
        }`}>
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-[#17170F] hover:opacity-80 transition-opacity"
            aria-label="carbi"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#17170F] text-[#FFFDF3] shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 17L7 8H17L19 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="8" cy="19" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="19" r="1.5" fill="currentColor"/>
              </svg>
            </span>
            <span className="text-[17px] font-semibold tracking-tight">carbi</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 rounded-full bg-transparent px-2 py-1">
            {PRIMARY_NAV.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 text-[14px] font-medium tracking-tight rounded-full transition-colors ${
                    active
                      ? 'bg-[#D9F85F] text-[#17170F] shadow-sm'
                      : 'text-[#4F4A3E] hover:text-[#17170F] hover:bg-[#F3F0E7]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="btn-icon hidden sm:flex bg-[#F3F0E7] border-2 border-[#17170F]/10 shadow-sm"
              aria-label="Buscar"
            >
              <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>

            {sessionReady && (
              <div className="relative hidden sm:block" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen((prev) => !prev)}
                  className="btn-icon"
                  aria-label="Conta"
                >
                  <UserRound className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-12 w-64 bg-white border border-[#EAEAE8] rounded-2xl p-2 shadow-lg animate-scale-in z-50 origin-top-right">
                    {isAuthenticated ? (
                      <>
                        <div className="px-3 py-2.5 mb-1 border-b border-[#EAEAE8]">
                          <p className="text-[11px] text-[#A3A3A3] tracking-wide uppercase font-medium">Conectado</p>
                          <p className="text-sm font-medium text-[#0A0A0A] truncate mt-0.5">{userEmail}</p>
                        </div>
                        <Link href="/minha-conta" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#525252] hover:text-[#0A0A0A] hover:bg-[#F4F4F2] transition-colors">
                          <UserRound className="w-4 h-4" strokeWidth={1.75} /> Meu perfil
                        </Link>
                        <Link href="/minha-conta/anuncios" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#525252] hover:text-[#0A0A0A] hover:bg-[#F4F4F2] transition-colors">
                          <LayoutDashboard className="w-4 h-4" strokeWidth={1.75} /> Meus anúncios
                        </Link>
                        <Link href="/minha-conta/conversas" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#525252] hover:text-[#0A0A0A] hover:bg-[#F4F4F2] transition-colors">
                          <MessageCircle className="w-4 h-4" strokeWidth={1.75} /> Conversas
                        </Link>
                        <div className="my-1 border-t border-[#EAEAE8]" />
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                        >
                          <LogOut className="w-4 h-4" strokeWidth={1.75} /> Sair
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/entrar"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#F4F4F2] transition-colors"
                      >
                        <UserRound className="w-4 h-4" strokeWidth={1.75} /> Entrar ou cadastrar
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            <Link
              href="/anunciar-carro"
              className="hidden md:inline-flex btn btn-sm ml-1 border-2 border-transparent bg-[#E9C0F7] text-[#17170F] shadow-sm hover:bg-[#D9F85F]"
            >
              Anunciar grátis
            </Link>

            <button
              onClick={() => setDrawerOpen(true)}
              className="btn-icon lg:hidden ml-1 bg-[#F3F0E7] border-2 border-[#17170F]/10 shadow-sm"
              aria-label="Menu"
            >
              <Menu className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/78 backdrop-blur-2xl border-t border-white/70 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(15,23,42,0.06)]">
        <div className="flex h-16 items-center justify-around max-[330px]:h-14">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors max-[330px]:gap-0.5 ${
                  active ? 'text-[#17170F]' : 'text-[#857C6B]'
                }`}
              >
                <Icon className="h-[22px] w-[22px] max-[330px]:h-[20px] max-[330px]:w-[20px]" strokeWidth={active ? 2 : 1.75} />
                <span className="text-[10px] font-medium tracking-tight max-[330px]:text-[9px]">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setAccountOpen((prev) => !prev)}
            className={`flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors max-[330px]:gap-0.5 ${
              accountOpen ? 'text-[#17170F]' : 'text-[#857C6B]'
            }`}
            aria-label="Conta"
          >
            <UserRound className="h-[22px] w-[22px] max-[330px]:h-[20px] max-[330px]:w-[20px]" strokeWidth={accountOpen ? 2 : 1.75} />
            <span className="text-[10px] font-medium tracking-tight max-[330px]:text-[9px]">Conta</span>
          </button>
        </div>
      </nav>

      {/* ── SEARCH OVERLAY ── */}
      {searchOpen && (
        <div className="fixed inset-0 z-[1000] bg-[#F3F0E7]/94 backdrop-blur-2xl animate-fade-in">
          <div className="container pt-8">
            <div className="flex items-center justify-between mb-12">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-[17px] font-semibold tracking-tight text-[#0A0A0A]">carbi</span>
              </Link>
              <button onClick={() => setSearchOpen(false)} className="btn-icon" aria-label="Fechar">
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="max-w-2xl mx-auto pt-8">
              <h2 className="text-2xl font-semibold tracking-tight mb-8 text-[#0A0A0A]">O que você procura?</h2>
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" strokeWidth={1.75} />
                  <input
                    ref={searchRef}
                    type="search"
                    placeholder="Marca, modelo ou palavra-chave..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input input-lg pl-14 text-lg"
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full mt-4">
                  Buscar veículos
                </button>
              </form>
              <div className="mt-10">
                <p className="eyebrow mb-4">Buscas populares</p>
                <div className="flex flex-wrap gap-2">
                  {['SUV', 'Elétrico', 'Hatch', 'Sedan', 'Picape', 'Até R$ 50k', 'Automático', 'Baixa km'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        router.push(`/carros-a-venda?q=${encodeURIComponent(s)}`)
                        setSearchOpen(false)
                      }}
                      className="badge badge-outline cursor-pointer hover:bg-[#17170F] hover:text-white hover:border-[#17170F] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER MENU (mobile) ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[1000] lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white/94 backdrop-blur-2xl shadow-xl animate-slide-in-right overflow-y-auto">
            <div className="sticky top-0 bg-white/94 backdrop-blur-2xl border-b border-white/80 px-6 h-16 flex items-center justify-between">
              <span className="text-[17px] font-semibold tracking-tight text-[#0A0A0A]">Menu</span>
              <button onClick={() => setDrawerOpen(false)} className="btn-icon" aria-label="Fechar">
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="p-6">
              {isAuthenticated ? (
                <div className="mb-6 pb-6 border-b border-[#EAEAE8]">
                  <p className="eyebrow mb-1">Conectado</p>
                  <p className="text-sm font-medium text-[#0A0A0A] truncate">{userEmail}</p>
                </div>
              ) : (
                <Link
                  href="/entrar"
                  className="btn btn-primary w-full mb-6"
                  onClick={() => setDrawerOpen(false)}
                >
                  Entrar ou cadastrar
                </Link>
              )}

              <nav className="flex flex-col">
                {PRIMARY_NAV.map((link) => {
                  const active = isActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center justify-between py-4 border-b border-[#EAEAE8] last:border-0"
                    >
                      <span className={`text-base font-medium tracking-tight ${active ? 'text-[#0A0A0A]' : 'text-[#0A0A0A]'}`}>
                        {link.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#A3A3A3]" strokeWidth={1.75} />
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-8 pt-8 border-t border-[#EAEAE8] space-y-1">
                {isAuthenticated && (
                  <>
                    <Link href="/minha-conta" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 py-3 text-sm font-medium text-[#525252]">
                      <UserRound className="w-4 h-4" strokeWidth={1.75} /> Meu perfil
                    </Link>
                    <Link href="/minha-conta/anuncios" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 py-3 text-sm font-medium text-[#525252]">
                      <LayoutDashboard className="w-4 h-4" strokeWidth={1.75} /> Meus anúncios
                    </Link>
                    <Link href="/minha-conta/conversas" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 py-3 text-sm font-medium text-[#525252]">
                      <MessageCircle className="w-4 h-4" strokeWidth={1.75} /> Conversas
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center gap-3 py-3 text-sm font-medium text-[#DC2626]">
                      <LogOut className="w-4 h-4" strokeWidth={1.75} /> Sair
                    </button>
                  </>
                )}
              </div>

              <div className="mt-8 p-5 bg-[#FFF8DF] rounded-2xl border-2 border-[#17170F]/10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#17170F]" strokeWidth={1.75} />
                  <span className="text-sm font-semibold text-[#0A0A0A]">Não sabe qual carro?</span>
                </div>
                <p className="text-sm text-[#525252] mb-3">Responda 5 perguntas e descubra o carro ideal para você.</p>
                <Link href="/qual-carro" onClick={() => setDrawerOpen(false)} className="text-sm font-medium text-[#0A0A0A] underline underline-offset-4">
                  Iniciar quiz →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
