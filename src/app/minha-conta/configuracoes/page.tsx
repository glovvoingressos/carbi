'use client'

import { motion } from 'motion/react'
import { Settings, Shield, Bell } from 'lucide-react'
import Link from 'next/link'

export default function ConfiguracoesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center">
          <Settings className="w-5 h-5 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Configurações</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Preferências da sua conta</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Conta e segurança</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Gerencie email, senha e autenticação.</p>
          </div>
        </div>
      </div>

      <Link
        href="/minha-conta/notificacoes"
        className="block bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Notificações</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Configure alertas de preços e mensagens.</p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
