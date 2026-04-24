'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, Search, CarFront, Home, BarChart3, GitCompare, Sparkles, ChevronRight, MessageCircle, LayoutDashboard, UserRound, LogOut, ShoppingBag, Tag } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

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

  // ── Scroll detector ──────────────────────────────────
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handle, { passive: true })
    handle()
    return () => window.removeEventListener('scroll', handle)
  }, [])

  // ── Fecha drawer ao navegar ───────────────────────────
  useEffect(() => {
    setDrawerOpen(false)
    setSearchOpen(false)
    setAccountOpen(false)
  }, [pathname])

  // ── Focus no input ao abrir search ───────────────────
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 80)
  }, [searchOpen])

  // ── Sessão do usuário ────────────────────────────────
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

  // ── Fecha menu de conta ao clicar fora ──────────────
  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!accountRef.current) return
      if (accountRef.current.contains(event.target as Node)) return
      setAccountOpen(false)
    }

    if (accountOpen) {
      document.addEventListener('mousedown', onClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [accountOpen])

  const navLinks = [
    { href: '/carros-a-venda', label: 'Comprar', icon: ShoppingBag },
    { href: '/anunciar-carro-bh', label: 'Vender', icon: Tag },
    { href: '/comparar', label: 'Comparar', icon: GitCompare },
    { href: '/marcas', label: 'Marcas', icon: CarFront },
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

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

  return (
    <>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FLOATING NAVBAR (CARBI STYLE)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-out flex justify-center pointer-events-none ${
          scrolled ? 'pt-4' : 'pt-6'
        }`}
      >
        <div 
          className={`flex items-center justify-between pointer-events-auto transition-all duration-500 ease-spring ${
            scrolled 
              ? 'w-[92%] md:w-[600px] h-14 px-5 bg-white/80 backdrop-blur-xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]' 
              : 'w-full max-w-[1200px] h-16 px-8 bg-transparent'
          } rounded-full`}
        >
          <Link href="/" className="font-display text-[24px] tracking-tighter text-dark lowercase transition-opacity hover:opacity-70">
            carbi
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {sessionReady ? (
              isAuthenticated ? (
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen((prev) => !prev)}
                    className="hidden md:inline-flex items-center gap-2 rounded-full border border-dark/20 bg-[#dff7e8] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-dark hover:-translate-y-0.5 transition"
                    aria-label="Abrir menu de conta"
                  >
                    <UserRound className="h-3.5 w-3.5" />
                    <span className="max-w-[120px] truncate">{userLabel}</span>
                  </button>

                  {accountOpen ? (
                    <div className="absolute right-0 top-12 w-56 rounded-2xl border border-black/10 bg-white p-2 shadow-xl">
                      <Link href="/minha-conta" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-dark hover:bg-surface">
                        <UserRound className="h-4 w-4" />
                        Meu perfil
                      </Link>
                      <Link href="/minha-conta/anuncios" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-dark hover:bg-surface">
                        <LayoutDashboard className="h-4 w-4" />
                        Meus anúncios
                      </Link>
                      <Link href="/minha-conta/conversas" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-dark hover:bg-surface">
                        <MessageCircle className="h-4 w-4" />
                        Meus chats
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link
                  href="/entrar"
                  className="hidden md:inline-flex items-center gap-2 rounded-full border border-dark/20 bg-[#fff8dc] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-dark hover:-translate-y-0.5 transition"
                >
                  <UserRound className="h-3.5 w-3.5" />
                  Entrar
                </Link>
              )
            ) : null}

            <button 
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors text-dark/60 hover:text-dark"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 pl-3 pr-1 py-1 bg-dark text-white rounded-full transition-transform hover:scale-105 active:scale-95 shadow-sm"
            >
              <span className="text-[12px] font-bold uppercase tracking-widest pl-2 hidden md:inline">Menu</span>
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <Menu className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FULLSCREEN SEARCH OVERLAY
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {searchOpen && (
        <div className="fixed inset-0 z-[1000] bg-white animate-in fade-in duration-300 flex flex-col items-center pt-32 px-6">
          <button 
            onClick={() => setSearchOpen(false)}
            className="absolute top-8 right-8 p-4 bg-[#f4f6f8] rounded-full hover:bg-black/5 transition-colors"
          >
            <X className="w-6 h-6 text-dark" />
          </button>
          <form className="w-full max-w-2xl" onSubmit={handleSearchSubmit}>
            <h2 className="text-4xl font-display mb-8 text-center">O que você procura?</h2>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-dark/20 group-focus-within:text-[var(--color-accent)] transition-colors" />
              <input 
                ref={searchRef}
                type="search"
                placeholder="Marca, modelo ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-20 bg-[#f4f6f8] rounded-[32px] pl-16 pr-8 text-2xl font-medium outline-none border-2 border-transparent focus:border-[var(--color-accent)] transition-all shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-dark px-6 py-3 text-sm font-black uppercase tracking-widest text-white"
            >
              Pesquisar
            </button>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <p className="w-full text-center text-sm text-dark/40 font-medium mb-2 uppercase tracking-widest">Sugestões</p>
              {['SUV', 'Elétrico', 'Hatch', 'Polo', 'T-Cross'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSearchTerm(s)
                    router.push(`/carros-a-venda?q=${encodeURIComponent(s)}`)
                    setSearchOpen(false)
                  }}
                  className="px-6 py-3 bg-[#f4f6f8] rounded-full text-sm font-bold hover:bg-dark hover:text-white transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </form>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODERN MENU DRAWER
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-end">
          <div 
            className="absolute inset-0 bg-dark/20 backdrop-blur-sm animate-in fade-in duration-500" 
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative w-full md:w-[480px] h-full bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] p-8 md:p-12 flex flex-col animate-in slide-in-from-right duration-500 ease-spring">
            <div className="flex items-center justify-between mb-16">
               <Link href="/" className="font-display text-3xl tracking-tighter text-dark lowercase">
                carbi
               </Link>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-3 bg-[#f4f6f8] rounded-full hover:bg-black/5 transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex flex-col gap-4">
              <div className="mb-1 rounded-[24px] border border-black/10 bg-surface p-4">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-dark/50">Conta</p>
                    <p className="line-clamp-1 text-sm font-semibold text-dark">{userEmail || 'Usuário conectado'}</p>
                    <div className="flex gap-2">
                      <Link href="/minha-conta" className="rounded-full bg-dark px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white">
                        Perfil
                      </Link>
                      <button onClick={handleSignOut} className="rounded-full border border-dark px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-dark">
                        Sair
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-dark/50">Conta</p>
                    <p className="text-sm font-semibold text-dark">Faça login para gerenciar anúncios e chats.</p>
                    <Link href="/entrar" className="inline-flex rounded-full bg-dark px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white">
                      Entrar / Criar conta
                    </Link>
                  </div>
                )}
              </div>

              {navLinks.map((link, i) => {
                const Icon = link.icon
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group flex items-center justify-between p-6 rounded-[32px] transition-all hover:translate-x-2 ${
                      active ? 'bg-dark text-white' : 'hover:bg-[#f4f6f8] text-dark'
                    }`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${active ? 'bg-white/10' : 'bg-white group-hover:bg-dark group-hover:text-white'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-2xl font-heading tracking-wide">{link.label}</span>
                    </div>
                    <ChevronRight className={`w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity ${active ? 'text-white' : 'text-dark'}`} />
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto space-y-4">
              <div className="h-px bg-black/5 mb-8" />
              <Link 
                href="/qual-carro"
                className="w-full flex items-center justify-between p-8 bg-[#1a1a1a] text-white rounded-[24px] hover:opacity-90 transition-opacity group"
              >
                <div className="flex items-center gap-4">
                  <Sparkles className="w-6 h-6 text-white/70" />
                  <span className="text-xl font-heading">Qual carro é pra mim?</span>
                </div>
                <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center">
                   <ChevronRight className="w-5 h-5 text-white" />
                </div>
              </Link>
              <p className="text-center text-[12px] font-bold text-dark/20 uppercase tracking-[0.2em] pt-8">
                carbi © 2026 — Inteligência Automotiva
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
