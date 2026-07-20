'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Menu, X, ChevronRight } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import Logo from '@/components/ui/Logo'

const LINKS = [
  { href: '/carros-a-venda', label: 'Comprar' },
  { href: '/anunciar-carro', label: 'Vender' },
  { href: '/marcas', label: 'Marcas' },
  { href: '/qual-carro', label: 'Qual carro?' },
  { href: '/rankings', label: 'FIPE' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAuth, setIsAuth] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return
    const supabase = getSupabaseBrowserClient()

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (session?.access_token) {
        fetchUnreadCount(session.access_token)
      }
    }
    checkAuth()

    const { data } = supabase.auth.onAuthStateChange((_event, updated) => {
      setIsAuth(!!updated)
      if (updated?.access_token) {
        fetchUnreadCount(updated.access_token)
      } else {
        setUnreadCount(0)
      }
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const fetchUnreadCount = async (accessToken: string) => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      setUnreadCount(data.unreadCount || 0)
    } catch {}
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <>
      <motion.nav
        className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
        aria-label="Navegação principal"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="navbar-inner">
          {/* Logo */}
          <Link href="/" className="navbar-logo">
            <Logo height={64} />
          </Link>

          {/* Desktop Links */}
          <div className="navbar-links">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`navbar-link ${isActive(l.href) ? 'navbar-link--active' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            {isAuth && (
              <Link href="/notificacoes" className="navbar-icon-btn" aria-label="Notificações">
                <Bell size={18} strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="navbar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </Link>
            )}
            <Link href="/entrar" className="navbar-login">
              Entrar
            </Link>
            <Link href="/anunciar-carro" className="navbar-cta">
              Anunciar
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="navbar-mobile"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="navbar-mobile-inner">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`navbar-mobile-link ${isActive(l.href) ? 'navbar-mobile-link--active' : ''}`}
                >
                  <span>{l.label}</span>
                  <ChevronRight size={16} />
                </Link>
              ))}
              {isAuth && (
                <Link href="/notificacoes" className="navbar-mobile-link">
                  <span>Notificações</span>
                  {unreadCount > 0 && (
                    <span className="navbar-mobile-badge">{unreadCount}</span>
                  )}
                </Link>
              )}
              <div className="navbar-mobile-actions">
                {!isAuth && (
                  <Link href="/entrar" className="navbar-mobile-login">
                    Entrar
                  </Link>
                )}
                <Link href="/anunciar-carro" className="navbar-mobile-cta">
                  Anunciar grátis
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
