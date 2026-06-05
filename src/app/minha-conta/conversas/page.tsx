import { Metadata } from 'next'
import { Suspense } from 'react'
import ConversationInbox from '@/components/marketplace/ConversationInbox'

export const metadata: Metadata = {
  title: 'Minhas conversas | Carbi',
  description: 'Converse com compradores e anunciantes com segurança, sem expor contato direto.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ConversationsPage() {
  return (
    <div className="container max-w-6xl pb-16 pt-24">
      <div className="hero-bento p-5 sm:p-6">
        <h1 className="text-balance">Chat interno</h1>
        <p className="mt-2 text-base font-medium text-[#52607A]">Todas as negociações do seu anúncio ficam protegidas dentro da plataforma.</p>
      </div>
      <div className="mt-6">
        <Suspense fallback={<div className="surface-strong p-6 text-sm text-[#52607A]">Carregando conversas...</div>}>
          <ConversationInbox />
        </Suspense>
      </div>
    </div>
  )
}
