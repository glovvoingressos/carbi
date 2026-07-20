import type { Metadata } from 'next'
import AdminAnalytics from '@/components/admin/AdminAnalytics'

export const metadata: Metadata = {
  title: 'Analytics | Admin',
  robots: { index: false, follow: false },
}

export default function AdminAnalyticsPage() {
  return <AdminAnalytics />
}
