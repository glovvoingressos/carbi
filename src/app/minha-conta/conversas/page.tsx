import { Metadata } from 'next'
import { Suspense } from 'react'
import ConversationInbox from '@/components/marketplace/ConversationInbox'

export const metadata: Metadata = {
  title: 'Minhas conversas | Carbi',
  description: 'Converse com compradores e anunciantes com segurança, sem expor contato direto.',
}

export default function ConversationsPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 pb-16 pt-24">
      <h1 className="text-3xl font-black text-dark">Chat interno</h1>
      <p className="mt-2 text-sm text-text-secondary">Todas as negociações do seu anúncio ficam protegidas dentro da plataforma.</p>
      <div className="mt-6">
        <Suspense fallback={<div className="rounded-2xl border border-border bg-white p-6 text-sm text-text-secondary">Carregando conversas...</div>}>
          <ConversationInbox />
        </Suspense>
      </div>
    </div>
  )
}
