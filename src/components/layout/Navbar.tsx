'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, Search, CarFront, Sparkles, ChevronRight, MessageCircle, LayoutDashboard, UserRound, LogOut, ShoppingBag, Tag, Truck } from 'lucide-react'
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
    { href: '/carros-a-venda', label: 'Carros', icon: ShoppingBag },
    { href: '/caminhoes', label: 'Caminhões', icon: Truck },
    { href: '/anunciar-carro', label: 'Vender', icon: Tag },
    { href: '/marcas', label: 'Marcas', icon: CarFront },
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

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-out flex justify-center pointer-events-none ${
          scrolled ? 'pt-4' : 'pt-6'
        }`}
      >
        <div 
          className={`flex items-center justify-between pointer-events-auto transition-all duration-500 ease-spring ${
            scrolled 
              ? 'w-[92%] md:w-[640px] h-16 px-6 bg-white/80 backdrop-blur-2xl border border-black/5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]' 
              : 'w-full max-w-[1200px] h-20 px-8 bg-transparent'
          } rounded-full`}
        >
          <Link href="/" className="font-display text-[28px] font-black tracking-tighter text-gradient hover:opacity-80 transition-opacity">
            carbi
          </Link>

          <div className="flex items-center gap-2">
            {sessionReady ? (
              isAuthenticated ? (
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen((prev) => !prev)}
                    className="hidden md:inline-flex items-center gap-2 rounded-full border border-black/5 bg-white shadow-sm px-4 py-2 text-xs font-bold uppercase tracking-wider text-dark hover:border-blue-200 hover:bg-blue-50 transition-all"
                  >
                    <UserRound className="h-4 w-4 text-blue-600" />
                    <span className="max-w-[120px] truncate">{userLabel}</span>
                  </button>

                  {accountOpen && (
                    <div className="absolute right-0 top-14 w-64 rounded-2xl border border-black/5 bg-white/90 backdrop-blur-xl p-2 shadow-xl animate-in slide-in-from-top-2">
                      <Link href="/minha-conta" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-dark hover:bg-black/5 transition-colors">
                        <UserRound className="h-4 w-4" /> Meu perfil
                      </Link>
                      <Link href="/minha-conta/anuncios" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-dark hover:bg-black/5 transition-colors">
                        <LayoutDashboard className="h-4 w-4" /> Meus anúncios
                      </Link>
                      <Link href="/minha-conta/conversas" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-dark hover:bg-black/5 transition-colors">
                        <MessageCircle className="h-4 w-4" /> Meus chats
                      </Link>
                      <div className="h-px bg-black/5 my-1 mx-2" />
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sair
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/entrar"
                  className="hidden md:inline-flex items-center gap-2 rounded-full border border-black/5 bg-white shadow-sm px-4 py-2 text-xs font-bold uppercase tracking-wider text-dark hover:border-blue-200 hover:bg-blue-50 transition-all"
                >
                  <UserRound className="h-4 w-4 text-blue-600" />
                  Entrar
                </Link>
              )
            ) : null}

            <button 
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors text-dark/60 hover:text-dark"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 pl-4 pr-1.5 py-1.5 bg-dark text-white rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_8px_20px_rgba(15,23,42,0.15)]"
            >
              <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Menu</span>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Menu className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* FULLSCREEN SEARCH OVERLAY */}
      {searchOpen && (
        <div className="fixed inset-0 z-[1000] bg-white/95 backdrop-blur-xl animate-in fade-in duration-300 flex flex-col items-center pt-32 px-6">
          <button 
            onClick={() => setSearchOpen(false)}
            className="absolute top-8 right-8 p-4 bg-black/5 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-6 h-6 text-dark" />
          </button>
          <form className="w-full max-w-3xl" onSubmit={handleSearchSubmit}>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-12 text-center text-dark">O que você procura?</h2>
            <div className="relative group">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-dark/20 group-focus-within:text-blue-600 transition-colors" />
              <input 
                ref={searchRef}
                type="search"
                placeholder="Ex: Jeep Compass 2024..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-24 bg-white rounded-full pl-20 pr-8 text-2xl font-bold outline-none border-2 border-black/5 focus:border-blue-600 transition-all shadow-xl"
              />
            </div>
            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition-all"
            >
              Pesquisar Veículos
            </button>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <p className="w-full text-center text-xs text-dark/40 font-bold mb-4 uppercase tracking-widest">Buscas Frequentes</p>
              {['SUV', 'Elétrico', 'Hatch', 'Polo', 'T-Cross'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSearchTerm(s)
                    router.push(`/carros-a-venda?q=${encodeURIComponent(s)}`)
                    setSearchOpen(false)
                  }}
                  className="px-6 py-3 bg-white border border-black/5 shadow-sm rounded-full text-sm font-bold hover:border-blue-600 hover:text-blue-600 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </form>
        </div>
      )}

      {/* MODERN MENU DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-end">
          <div 
            className="absolute inset-0 bg-dark/20 backdrop-blur-sm animate-in fade-in duration-500" 
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative w-full md:w-[480px] h-full bg-[#FAFAFA] shadow-[-20px_0_60px_rgba(0,0,0,0.1)] p-8 md:p-12 flex flex-col animate-in slide-in-from-right duration-500 ease-spring">
            <div className="flex items-center justify-between mb-12">
               <Link href="/" className="font-display text-3xl font-black tracking-tighter text-gradient">
                carbi
               </Link>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-3 bg-white border border-black/5 shadow-sm rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5 text-dark" />
              </button>
            </div>

            <nav className="flex flex-col gap-3">
              <div className="mb-4 rounded-[24px] border border-black/5 bg-white p-5 shadow-sm">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-dark/30">Minha Conta</p>
                    <p className="line-clamp-1 text-sm font-bold text-dark">{userEmail || 'Usuário conectado'}</p>
                    <div className="flex gap-2">
                      <Link href="/minha-conta" className="rounded-full bg-blue-50 text-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-blue-100 transition-colors">
                        Painel
                      </Link>
                      <button onClick={handleSignOut} className="rounded-full border border-black/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-dark hover:bg-black/5 transition-colors">
                        Sair
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-dark/30">Minha Conta</p>
                    <p className="text-sm font-medium text-dark/60">Faça login para gerenciar seus anúncios e mensagens.</p>
                    <Link href="/entrar" className="inline-flex rounded-full bg-dark px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-dark/90 transition-colors">
                      Entrar na plataforma
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
                    className={`group flex items-center justify-between p-5 rounded-[24px] border transition-all ${
                      active ? 'bg-white border-blue-200 shadow-md shadow-blue-600/5' : 'bg-transparent border-transparent hover:bg-white hover:border-black/5 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'bg-white text-dark group-hover:bg-blue-50 group-hover:text-blue-600 shadow-sm'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xl font-heading font-bold ${active ? 'text-blue-600' : 'text-dark'}`}>{link.label}</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${active ? 'text-blue-600' : 'text-dark/30'}`} />
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto space-y-6 pt-8">
              <Link 
                href="/qual-carro"
                className="w-full flex items-center justify-between p-6 bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-[24px] hover:shadow-lg hover:shadow-blue-600/25 hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <Sparkles className="w-6 h-6 text-blue-200" />
                  <span className="text-lg font-heading font-bold">Descobrir meu carro ideal</span>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                   <ChevronRight className="w-5 h-5 text-white" />
                </div>
              </Link>
              <p className="text-center text-[11px] font-bold text-dark/30 uppercase tracking-widest">
                carbi © 2026 — Premium Automotive
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
