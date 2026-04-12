import Link from 'next/link'
import { LayoutDashboard, MessageCircle, CarFront, UserRound } from 'lucide-react'
import ProfilePanel from '@/components/marketplace/ProfilePanel'

export default function MinhaContaPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 pb-16 pt-28">
      <section className="pastel-card p-6 sm:p-8" style={{ backgroundColor: '#edf2f7' }}>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-dark/60">Minha conta</p>
        <h1 className="mt-2 text-3xl font-black text-dark sm:text-4xl">Seu painel de perfil</h1>
        <p className="mt-2 text-base font-medium text-text-secondary">
          Acesse seus anúncios, chats e ação rápida para publicar um novo veículo.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/minha-conta/anuncios" className="rounded-2xl bg-[#f6f8fb] p-4 transition hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-dark">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-sm font-black">Meus anúncios</span>
            </div>
            <p className="mt-1 text-sm font-medium text-text-secondary">Editar fotos, preço e descrição.</p>
          </Link>

          <Link href="/minha-conta/conversas" className="rounded-2xl bg-[#f3f6fa] p-4 transition hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-dark">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-black">Meus chats</span>
            </div>
            <p className="mt-1 text-sm font-medium text-text-secondary">Acompanhar conversas com compradores.</p>
          </Link>

          <Link href="/anunciar-carro-bh" className="rounded-2xl bg-[#f6f8fb] p-4 transition hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-dark">
              <CarFront className="h-4 w-4" />
              <span className="text-sm font-black">Anunciar carro</span>
            </div>
            <p className="mt-1 text-sm font-medium text-text-secondary">Publicar novo anúncio em poucos passos.</p>
          </Link>

          <Link href="/entrar" className="rounded-2xl bg-[#f3f6fa] p-4 transition hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-dark">
              <UserRound className="h-4 w-4" />
              <span className="text-sm font-black">Login / Segurança</span>
            </div>
            <p className="mt-1 text-sm font-medium text-text-secondary">Entrar ou trocar de conta.</p>
          </Link>
        </div>
      </section>

      <div className="mt-6">
        <ProfilePanel />
      </div>
    </main>
  )
}
