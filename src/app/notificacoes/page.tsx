import type { Metadata } from 'next'
import NotificationsPage from '@/components/notifications/NotificationsPage'

export const metadata: Metadata = {
  title: 'Notificações | Carbi',
  robots: { index: false, follow: false },
}

export default function NotificacoesPage() {
  return <NotificationsPage />
}
