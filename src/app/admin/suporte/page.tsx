import type { Metadata } from 'next'

import AdminSupportInbox from '@/components/admin/AdminSupportInbox'

export const metadata: Metadata = {
  title: 'Suporte | Admin',
  robots: { index: false, follow: false },
}

export default function AdminSupportPage() {
  return <AdminSupportInbox />
}
