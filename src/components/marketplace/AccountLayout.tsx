'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
  LayoutDashboard, Car, MessageCircle, Bell, Settings,
  LogOut, User, Eye, Heart, Star
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

const navItems = [
  { href: '/minha-conta', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/minha-conta/anuncios', label: 'Meus anúncios', icon: Car },
  { href: '/minha-conta/conversas', label: 'Mensagens', icon: MessageCircle },
  { href: '/minha-conta/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/minha-conta/configuracoes', label: 'Configurações', icon: Settings },
]

const stats = [
  { label: 'Anúncios', value: '12', icon: Car },
  { label: 'Visualizações', value: '1.4k', icon: Eye },
  { label: 'Favoritos', value: '89', icon: Heart },
  { label: 'Avaliação', value: '4.8', icon: Star },
]

const ease = [0.23, 1, 0.32, 1] as const
const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease },
}

interface AccountLayoutProps {
  children: React.ReactNode
  user: { email: string; fullName: string; avatarUrl: string }
}

export default function AccountLayout({ children, user }: AccountLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const isActive = (href: string) =>
    href === '/minha-conta' ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await getSupabaseBrowserClient().auth.signOut()
      router.replace('/')
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-16 pt-0">
      <div className="relative h-44 bg-gradient-to-br from-[#E8E0F0] via-[#D6E4F0] to-[#F0E0D0]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#F7F7F7] via-transparent to-transparent" />
      </div>
      <div className="relative max-w-2xl mx-auto px-4 -mt-16 z-10">
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 rounded-full border-[4px] border-white bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden flex items-center justify-center">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
            )}
          </div>
        </div>
        <motion.div {...fade} className="text-center mb-6">
          <h1 className="text-[28px] font-bold text-[#111111] leading-tight">
            {user.fullName || 'Usuário'}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F0F0F0] text-[#555]">
              Vendedor
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E8F5E9] text-[#2E7D32]">
              Verificado
            </span>
          </div>
          <p className="text-sm text-[#888] mt-2">Carros usados e seminovos</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease }}
          className="grid grid-cols-4 gap-3 mb-6"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-[20px] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-center"
            >
              <stat.icon className="w-4 h-4 mx-auto mb-1.5 text-[#888]" strokeWidth={1.75} />
              <p className="text-base font-bold text-[#111]">{stat.value}</p>
              <p className="text-[10px] text-[#999] font-medium">{stat.label}</p>
            </div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <button className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#111] text-white text-sm font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:bg-[#333] transition-colors">
            <User className="w-4 h-4" strokeWidth={2} />
            Editar Perfil
          </button>
          <button className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-gray-50 transition-colors">
            <Settings className="w-4 h-4 text-[#555]" strokeWidth={1.75} />
          </button>
          <button className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-gray-50 transition-colors">
            <Bell className="w-4 h-4 text-[#555]" strokeWidth={1.75} />
          </button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2, ease }}
          className="mb-6"
        >
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive(item.href)
                    ? 'bg-[#111] text-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
                    : 'bg-white text-[#666] border border-gray-200 hover:border-gray-300'
                }`}
              >
                <item.icon className="w-4 h-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            ))}
          </div>
          <div className="hidden lg:flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all ${
                    active
                      ? 'bg-[#111] text-white font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
                      : 'text-[#666] hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                  }`}
                >
                  <item.icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  {item.label}
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="ml-auto w-2 h-2 rounded-full bg-white"
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease }}
          className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(0,0,0,0.05)] p-6 min-h-[300px]"
        >
          {children}
        </motion.div>
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-[#999] hover:text-[#E53935] hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
            {loggingOut ? 'Saindo...' : 'Sair da conta'}
          </button>
        </div>
      </div>
    </div>
  )
}
