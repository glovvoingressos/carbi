'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, ArrowLeftRight, Trophy, CarFront, Home } from 'lucide-react'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <CarFront className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-semibold text-text tracking-tight">
                CarDecision<span className="text-primary">.br</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/" className="nav-link">
                <Home className="w-4 h-4 mr-1.5" />
                Home
              </Link>
              <Link href="/marcas" className="nav-link">
                Marcas
              </Link>
              <Link href="/comparar" className="nav-link">
                <ArrowLeftRight className="w-4 h-4 mr-1.5" />
                Comparar
              </Link>
              <Link href="/rankings" className="nav-link">
                <Trophy className="w-4 h-4 mr-1.5" />
                Rankings
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/qual-carro" className="hidden md:inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                <Search className="w-4 h-4" />
                Qual carro?
              </Link>
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <div className="p-4">
              <button onClick={() => setMobileOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="px-4 flex flex-col gap-1">
              <Link href="/" onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                <Home className="w-4 h-4 mr-3" />
                Home
              </Link>
              <Link href="/marcas" onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                Marcas
              </Link>
              <Link href="/comparar" onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                <ArrowLeftRight className="w-4 h-4 mr-3" />
                Comparar carros
              </Link>
              <Link href="/rankings" onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                <Trophy className="w-4 h-4 mr-3" />
                Rankings
              </Link>
            </nav>
            <div className="px-4 mt-4">
              <Link href="/qual-carro" onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-3 rounded-lg transition-colors">
                <Search className="w-4 h-4" />
                Qual carro?
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
