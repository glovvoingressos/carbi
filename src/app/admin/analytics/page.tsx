import type { Metadata } from 'next'
import Link from 'next/link'
import AdminAnalytics from '@/components/admin/AdminAnalytics'

export const metadata: Metadata = {
  title: 'Analytics | Admin',
  robots: { index: false, follow: false },
}

export default function AdminAnalyticsPage() {
  return (
    <>
      <div className="mx-auto flex max-w-6xl justify-end gap-2 px-8 pt-6">
        <Link href="/admin/usuarios" className="rounded-xl border border-[#E1E4DE] bg-white px-4 py-2 text-sm font-bold text-[#1A1A1A] transition hover:bg-[#F7F8F4]">Usuários cadastrados</Link>
        <Link href="/admin/suporte" className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-[#D4F576] transition hover:bg-[#2D2D2D]">Inbox de suporte</Link>
      </div>
      <AdminAnalytics />
    </>
  )
}
