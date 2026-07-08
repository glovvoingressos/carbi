'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/carros-a-venda', icon: Search, label: 'Buscar' },
  { href: '/anunciar-carro', icon: PlusCircle, label: 'Anunciar' },
  { href: '/minha-conta/conversas', icon: MessageCircle, label: 'Chat' },
  { href: '/minha-conta', icon: User, label: 'Perfil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Menu principal">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/' && pathname.startsWith(item.href))
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon 
              size={22} 
              strokeWidth={isActive ? 2.5 : 1.5}
              className="bottom-nav-icon"
            />
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
