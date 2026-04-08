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
    const handle = () => setScrolled(window.scrollY > 60)
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

  // ── Fecha drawer ao pressionar Escape ─────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDrawerOpen(false); setSearchOpen(false) } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

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
          NAVBAR
          Estado inicial: transparente
          Ao rolar 60px: blur + branco + border
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav
        className={`navbar${scrolled ? ' scrolled' : ''}`}
        role="navigation"
        aria-label="Navegação principal"
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>

          {/* ── Logo ─────────────────────────── */}
          <Link href="/" className="flex items-center gap-2.5" aria-label="CarDecision — Página inicial">
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'var(--color-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CarFront className="w-4 h-4" style={{ color: '#fff' }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
              Car<span style={{ color: 'var(--color-accent)' }}>Decision</span>
            </span>
          </Link>

          {/* ── Desktop Links (centrados) ──────── */}
          <div className="hidden md:flex items-center gap-1" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${isActive(link.href) ? ' active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Direita: Search + CTA ─────────── */}
          <div className="flex items-center gap-2">

            {/* Inline search (desktop) */}
            <div className="hidden md:flex items-center" style={{ position: 'relative' }}>
              {searchOpen ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--color-card)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '6px 6px 6px 16px',
                    border: '1px solid var(--color-border-solid)',
                    width: 260,
                    boxShadow: '0 0 0 3px var(--color-accent-glow)',
                    animation: 'fadeIn 150ms ease',
                  }}
                >
                  <Search style={{ width: 15, height: 15, color: 'var(--color-text-3)', flexShrink: 0 }} />
                  <input
                    ref={searchRef}
                    type="search"
                    placeholder="Buscar modelo ou marca..."
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 13,
                      color: 'var(--color-text)',
                    }}
                    onBlur={() => setSearchOpen(false)}
                  />
                  <button onClick={() => setSearchOpen(false)} style={{ flexShrink: 0, color: 'var(--color-text-3)', cursor: 'pointer', background: 'none', border: 'none' }}>
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="btn-icon"
                  aria-label="Buscar"
                  style={{ border: 'none' }}
                >
                  <Search style={{ width: 17, height: 17, color: 'var(--color-text-2)' }} />
                </button>
              )}
            </div>

            {/* CTA pill — desktop */}
            <Link
              href="/rankings"
              className="btn btn-primary hidden md:inline-flex"
              style={{ height: 40, fontSize: 13, padding: '0 18px' }}
            >
              Ver carros
              <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>

            {/* Hamburger — mobile */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn-icon md:hidden"
              aria-label="Abrir menu"
              style={{ border: 'none' }}
            >
              <Menu style={{ width: 20, height: 20, color: 'var(--color-text)' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MOBILE DRAWER (slide from right)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} aria-hidden />
          <aside className="drawer-panel" role="dialog" aria-label="Menu de navegação">
            {/* Cabeçalho do drawer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CarFront style={{ width: 16, height: 16, color: '#fff' }} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 800 }}>
                  Car<span style={{ color: 'var(--color-accent)' }}>Decision</span>
                </span>
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="btn-icon"
                aria-label="Fechar menu"
                style={{ border: 'none', width: 36, height: 36, borderRadius: 'var(--radius-sm)' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {navLinks.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`drawer-link${active ? ' active' : ''}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Icon style={{ width: 18, height: 18, opacity: 0.7, flexShrink: 0 }} />
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Divisor */}
            <div style={{ height: 1, background: 'var(--color-border)', margin: '20px 0' }} />

            {/* CTA mobile */}
            <Link
              href="/qual-carro"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', gap: 8 }}
              onClick={() => setDrawerOpen(false)}
            >
              <Sparkles style={{ width: 15, height: 15 }} />
              Qual carro é para mim?
            </Link>

            {/* Search mobile */}
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--color-card-2)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                border: '1px solid var(--color-border)',
              }}
            >
              <Search style={{ width: 16, height: 16, color: 'var(--color-text-3)', flexShrink: 0 }} />
              <input
                type="search"
                placeholder="Buscar modelo ou marca..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  color: 'var(--color-text)',
                }}
              />
            </div>
          </aside>
        </>
      )}
    </>
  )
}
