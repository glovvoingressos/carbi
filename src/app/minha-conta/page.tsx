import Link from 'next/link'
import { LayoutDashboard, MessageCircle, CarFront, UserRound } from 'lucide-react'
import ProfilePanel from '@/components/marketplace/ProfilePanel'

export default function MinhaContaPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 pb-16 pt-28">
      <section className="pastel-card pastel-card-blue p-6 sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-dark/60">Minha conta</p>
        <h1 className="mt-2 text-3xl font-black text-dark sm:text-4xl">Seu painel de perfil</h1>
        <p className="mt-2 text-sm font-semibold text-text-secondary">
          Acesse seus anúncios, chats e ação rápida para publicar um novo veículo.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/minha-conta/anuncios" className="rounded-2xl bg-[#fff8dc] p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-center gap-2 text-dark">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-sm font-black">Meus anúncios</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-text-secondary">Editar fotos, preço e descrição.</p>
          </Link>

          <Link href="/minha-conta/conversas" className="rounded-2xl bg-[#f4fbf4] p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-center gap-2 text-dark">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-black">Meus chats</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-text-secondary">Acompanhar conversas com compradores.</p>
          </Link>

          <Link href="/anunciar-carro-bh" className="rounded-2xl bg-[#dff7e8] p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-center gap-2 text-dark">
              <CarFront className="h-4 w-4" />
              <span className="text-sm font-black">Anunciar carro</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-dark/70">Publicar novo anúncio em poucos passos.</p>
          </Link>

          <Link href="/entrar" className="rounded-2xl bg-[#f3efff] p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-center gap-2 text-dark">
              <UserRound className="h-4 w-4" />
              <span className="text-sm font-black">Login / Segurança</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-text-secondary">Entrar ou trocar de conta.</p>
          </Link>
        </div>
      </section>

      <div className="mt-6">
        <ProfilePanel />
      </div>
    </main>
  )
}
