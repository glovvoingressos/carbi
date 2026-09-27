'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, Menu, X, ChevronRight, User } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import Logo from '@/components/ui/Logo'

const LINKS = [
  { href: '/carros-a-venda', label: 'Comprar' },
  { href: '/caminhoes', label: 'Caminhões' },
  { href: '/anunciar-carro', label: 'Vender' },
  { href: '/marcas', label: 'Marcas' },
  { href: '/qual-carro', label: 'Qual carro?' },
  { href: '/rankings', label: 'FIPE' },
]

export default function Navbar() {
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAuth, setIsAuth] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const pathname = usePathname()
  const lastScroll = useRef(0)
  const menuToggleRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Scroll hide/show
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y < 50) {
        setHidden(false)
      } else if (y > lastScroll.current + 8) {
        setHidden(true)
        setOpen(false)
      } else if (y < lastScroll.current - 8) {
        setHidden(false)
      }
      lastScroll.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const closeMenu = window.setTimeout(() => setOpen(false), 0)
    return () => window.clearTimeout(closeMenu)
  }, [pathname])

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mediaQuery) return

    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches)
    updateMotionPreference()
    mediaQuery.addEventListener?.('change', updateMotionPreference)

    return () => mediaQuery.removeEventListener?.('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    if (!open) return

    const menu = mobileMenuRef.current
    if (!menu) return

    const focusableElements = Array.from(
      menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    )
    const focusFrame = window.requestAnimationFrame(() => focusableElements[0]?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        window.requestAnimationFrame(() => menuToggleRef.current?.focus())
        return
      }

      if (event.key !== 'Tab' || focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const closeMobileMenu = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuToggleRef.current?.focus())
    }
  }

  const fetchUnreadCount = async (token: string) => {
    try {
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      setUnreadCount(d.unreadCount || 0)
    } catch {}
  }

  // Auth state
  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return
    const supabase = getSupabaseBrowserClient()

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (session?.access_token) fetchUnreadCount(session.access_token)
    }
    checkAuth()

    const { data } = supabase.auth.onAuthStateChange((_event: string, updated: { access_token?: string } | null) => {
      setIsAuth(!!updated)
      if (updated?.access_token) fetchUnreadCount(updated.access_token)
      else setUnreadCount(0)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <>
      {/* Desktop Navbar */}
      <nav className={`navbar ${hidden ? 'navbar--hidden' : ''}`} aria-label="Navegação principal">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">
            <Logo height={64} />
          </Link>

          <div className="navbar-links">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={`navbar-link ${isActive(l.href) ? 'navbar-link--active' : ''}`}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="navbar-actions">
            {isAuth && (
              <Link href="/notificacoes" className="navbar-icon-btn" aria-label="Notificações">
                <Bell size={18} strokeWidth={1.75} />
                {unreadCount > 0 && <span className="navbar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </Link>
            )}
            <Link href={isAuth ? '/minha-conta' : '/entrar'} className="navbar-login">
              {isAuth ? 'Minha conta' : 'Entrar'}
            </Link>
            <Link href="/anunciar-carro" className="navbar-cta">Anunciar</Link>
          </div>

          <div className="navbar-mobile-actions-row">
            <Link href="/notificacoes" className="navbar-icon-btn navbar-icon-btn--mobile" aria-label="Notificações">
              <Bell size={18} strokeWidth={1.75} />
              {unreadCount > 0 && <span className="navbar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </Link>
            <Link href={isAuth ? '/minha-conta' : '/entrar'} className="navbar-icon-btn navbar-icon-btn--mobile" aria-label={isAuth ? 'Minha conta' : 'Entrar'}>
              <User size={18} strokeWidth={1.75} />
            </Link>
            <button
              ref={menuToggleRef}
              type="button"
              className="navbar-toggle"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={open}
              aria-controls="navbar-mobile-menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="navbar-mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            onClick={() => closeMobileMenu(true)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="navbar-mobile"
            id="navbar-mobile-menu"
            ref={mobileMenuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="navbar-mobile-inner">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={`navbar-mobile-link ${isActive(l.href) ? 'navbar-mobile-link--active' : ''}`}>
                  <span>{l.label}</span>
                  <ChevronRight size={16} />
                </Link>
              ))}
              {isAuth && (
                <Link href="/notificacoes" className="navbar-mobile-link">
                  <span>Notificações</span>
                  {unreadCount > 0 && <span className="navbar-mobile-badge">{unreadCount}</span>}
                </Link>
              )}
              <div className="navbar-mobile-actions">
                <Link href={isAuth ? '/minha-conta' : '/entrar'} className="navbar-mobile-login">
                  {isAuth ? 'Minha conta' : 'Entrar'}
                </Link>
                <Link href="/anunciar-carro" className="navbar-mobile-cta">Anunciar grátis</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
