'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Search, CarFront, Home, BarChart3, GitCompare, Sparkles } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', h, { passive: true })
    h()
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => { setDrawerOpen(false) }, [pathname])

  const links = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/marcas', label: 'Marcas', icon: CarFront },
    { href: '/comparar', label: 'Comparar', icon: GitCompare },
    { href: '/rankings', label: 'Rankings', icon: BarChart3 },
  ]

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-dark)' }}>
              <CarFront className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-bold" style={{ color: 'var(--color-text)' }}>
              Car<span style={{ color: 'var(--color-accent)' }}>Decision</span>
            </span>
          </Link>

          {/* Desktop Nav — Pill tabs like reference */}
          <div
            className="hidden md:flex items-center gap-1 px-1.5 py-1.5"
            style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)' }}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname === link.href ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-2">
            <Link href="/qual-carro" className="btn-accent hidden md:inline-flex" style={{ height: 38, fontSize: 13 }}>
              <Sparkles className="w-3.5 h-3.5" />
              Qual carro?
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden btn-icon"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="drawer-panel">
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-bold">Menu</span>
              <button onClick={() => setDrawerOpen(false)} className="btn-icon" style={{ width: 36, height: 36 }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="drawer-link" onClick={() => setDrawerOpen(false)}>
                  <link.icon className="w-5 h-5" style={{ color: 'var(--color-text-2)' }} />
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/qual-carro" className="btn-accent w-full" onClick={() => setDrawerOpen(false)}>
                <Sparkles className="w-4 h-4" />
                Qual carro?
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}
