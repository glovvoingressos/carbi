'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart, User } from 'lucide-react'

import { useState, useEffect } from 'react'

export default function BottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const items = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/marcas', label: 'Buscar', icon: Search },
    { href: '/rankings', label: 'Rankings', icon: Heart },
    { href: '/qual-carro', label: 'Perfil', icon: User },
  ]

  return (
    <div className="bottom-nav md:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`bottom-nav-item ${pathname === item.href ? 'active' : ''}`}
        >
          <item.icon />
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  )
}
