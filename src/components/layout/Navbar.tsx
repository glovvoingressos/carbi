'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, Search, CarFront, Home, BarChart3, GitCompare, Sparkles, ChevronRight } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const searchRef = useRef<HTMLInputElement>(null)

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
  }, [pathname])

  // ── Focus no input ao abrir search ───────────────────
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 80)
  }, [searchOpen])

  const navLinks = [
    { href: '/',         label: 'Início',    icon: Home },
    { href: '/marcas',   label: 'Marcas',    icon: CarFront },
    { href: '/comparar', label: 'Comparar',  icon: GitCompare },
    { href: '/rankings', label: 'Rankings',  icon: BarChart3 },
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

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
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-dark rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <CarFront className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-[18px] tracking-widest text-dark uppercase">
              Car<span className="text-[var(--color-accent)]">bi</span>
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-1">
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
          <div className="w-full max-w-2xl">
            <h2 className="text-4xl font-heading mb-8 text-center">O que você procura?</h2>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-dark/20 group-focus-within:text-[var(--color-accent)] transition-colors" />
              <input 
                ref={searchRef}
                type="text"
                placeholder="Marca, modelo ou categoria..."
                className="w-full h-20 bg-[#f4f6f8] rounded-[32px] pl-16 pr-8 text-2xl font-medium outline-none border-2 border-transparent focus:border-[var(--color-accent)] transition-all shadow-sm"
              />
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <p className="w-full text-center text-sm text-dark/40 font-medium mb-2 uppercase tracking-widest">Sugestões</p>
              {['SUV', 'Elétrico', 'Hatch', 'Polo', 'T-Cross'].map(s => (
                <button key={s} className="px-6 py-3 bg-[#f4f6f8] rounded-full text-sm font-bold hover:bg-dark hover:text-white transition-all">{s}</button>
              ))}
            </div>
          </div>
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
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-dark rounded-xl flex items-center justify-center">
                  <CarFront className="w-4 h-4 text-white" />
                </div>
                <span className="font-heading text-2xl tracking-tight text-dark">
                  Car<span className="text-[var(--color-accent)]">bi</span>
                </span>
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
                className="w-full flex items-center justify-between p-8 bg-[var(--color-bento-blue)] text-white rounded-[32px] hover:scale-[1.02] transition-transform group"
              >
                <div className="flex items-center gap-4">
                  <Sparkles className="w-6 h-6" />
                  <span className="text-xl font-heading">Qual carro é pra mim?</span>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white animate-pulse group-hover:animate-none">
                   <ChevronRight className="w-5 h-5 group-hover:text-[var(--color-bento-blue)]" />
                </div>
              </Link>
              <p className="text-center text-[12px] font-bold text-dark/20 uppercase tracking-[0.2em] pt-8">
                Carbi © 2026 — Inteligência Automotiva
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

