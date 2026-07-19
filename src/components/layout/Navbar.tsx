'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
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
  const [showBanner, setShowBanner] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAuth, setIsAuth] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Check auth and fetch unread count
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
      {showBanner && (
        <div className="top-banner" id="topBanner">
          <span>Anuncie seu carro <strong>grátis</strong> por tempo limitado —</span>
          <Link href="/anunciar-carro">Criar anúncio agora</Link>
          <button className="banner-close" onClick={() => setShowBanner(false)} aria-label="Fechar aviso">×</button>
        </div>
      )}

      <motion.nav
        className={`fingen-nav ${scrolled ? 'scrolled' : ''}`}
        aria-label="Navegação principal"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link href="/" className="fingen-nav-logo">
          <Logo height={48} light />
        </Link>

        <div className="fingen-nav-links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`fingen-nav-link ${isActive(l.href) ? 'active' : ''}`}
            >
              {l.label}
              {isActive(l.href) && (
                <motion.span
                  layoutId="nav-pill"
                  className="fingen-nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
            </Link>
          ))}
        </div>

        <div className="fingen-nav-actions">
          {isAuth ? (
            <Link href="/notificacoes" className="fingen-nav-icon-btn" aria-label="Notificações" style={{ position: 'relative' }}>
              <Bell size={20} strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span
                  className="fingen-nav-badge"
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    background: '#DC2626',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    lineHeight: 1,
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          ) : (
            <Link href="/entrar" className="fingen-nav-ghost">Entrar</Link>
          )}
          <Link href="/anunciar-carro" className="fingen-nav-cta">Anunciar grátis</Link>
        </div>

        <button
          className={`fingen-nav-burger ${open ? 'open' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fingen-nav-mobile"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`fingen-nav-link ${isActive(l.href) ? 'active' : ''}`}
              >
                {l.label}
                {isActive(l.href) && <span className="fingen-nav-pill fingen-nav-pill-m" />}
              </Link>
            ))}
            {isAuth && (
              <Link href="/notificacoes" className="fingen-nav-link">
                Notificações
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: 6,
                    background: '#DC2626',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 9,
                    padding: '2px 6px',
                    lineHeight: 1.2,
                  }}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <div className="fingen-nav-mobile-actions">
              {isAuth ? null : <Link href="/entrar" className="fingen-nav-ghost">Entrar</Link>}
              <Link href="/anunciar-carro" className="fingen-nav-cta">Anunciar grátis</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
