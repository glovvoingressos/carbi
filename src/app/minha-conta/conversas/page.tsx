import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft, MessageCircle, ShieldCheck } from 'lucide-react'
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
    <main className="conversation-page-shell">
      <div className="conversation-page-head">
        <Link href="/minha-conta" className="conversation-back-link">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Minha conta
        </Link>

        <div className="conversation-hero-line">
          <div>
            <span className="auth-hero-kicker">Chat interno</span>
            <h1 className="conversation-title">Conversas protegidas em um painel claro.</h1>
            <p className="conversation-copy">
              Negocie pelo chat da Carbi, acompanhe propostas e responda compradores sem expor telefone ou e-mail.
            </p>
          </div>

          <div className="conversation-trust-card">
            <div className="conversation-trust-icon">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <strong>Contato protegido</strong>
              <span>Histórico real, vinculado ao anúncio.</span>
            </div>
          </div>
        </div>

        <div className="conversation-head-actions">
          <span><MessageCircle className="h-4 w-4" /> Mensagens em tempo real</span>
          <span>Dados do vendedor privados</span>
          <span>Negociação vinculada ao veículo</span>
        </div>
      </div>

      <Suspense fallback={<div className="conversation-loading-card">Carregando conversas...</div>}>
        <ConversationInbox />
      </Suspense>
    </main>
  )
}
