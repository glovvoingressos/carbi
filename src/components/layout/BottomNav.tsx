'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, MessageCircle, PlusCircle } from 'lucide-react'

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
    { href: '/anunciar-carro-bh', label: 'Anunciar', icon: PlusCircle },
    { href: '/minha-conta/conversas', label: 'Conversas', icon: MessageCircle },
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
