'use client'

import { motion } from 'motion/react'
import { Bell } from 'lucide-react'
import NotificationsPage from '@/components/notifications/NotificationsPage'

export default function NotificacoesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center">
          <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Notificações</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Alertas de preços, mensagens e novidades</p>
        </div>
      </div>
      <NotificationsPage />
    </motion.div>
  )
}
