import Link from 'next/link'
import { LayoutDashboard, MessageCircle, CarFront, UserRound } from 'lucide-react'
import ProfilePanel from '@/components/marketplace/ProfilePanel'

export default function MinhaContaPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f3] pb-16 pt-32">
      <div className="container mx-auto max-w-4xl px-4">
        <section className="bg-white rounded-[32px] border border-black/5 p-8 sm:p-12 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-dark/30">Minha conta</p>
          <h1 className="mt-2 text-4xl font-black text-dark tracking-tight">Seu painel de perfil</h1>
          <p className="mt-3 text-lg font-medium text-dark/50">
            Acesse seus anúncios, chats e ação rápida para publicar um novo veículo.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link href="/minha-conta/anuncios" className="rounded-3xl bg-[#f5f5f3] border border-black/5 p-6 transition-all hover:-translate-y-1 hover:bg-dark hover:text-white group">
              <div className="flex items-center gap-3 text-dark group-hover:text-white transition-colors">
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-base font-black">Meus anúncios</span>
              </div>
              <p className="mt-2 text-sm font-medium text-dark/50 group-hover:text-white/60 transition-colors">Editar fotos, preço e descrição.</p>
            </Link>

            <Link href="/minha-conta/conversas" className="rounded-3xl bg-[#f5f5f3] border border-black/5 p-6 transition-all hover:-translate-y-1 hover:bg-dark hover:text-white group">
              <div className="flex items-center gap-3 text-dark group-hover:text-white transition-colors">
                <MessageCircle className="h-5 w-5" />
                <span className="text-base font-black">Meus chats</span>
              </div>
              <p className="mt-2 text-sm font-medium text-dark/50 group-hover:text-white/60 transition-colors">Acompanhar conversas com compradores.</p>
            </Link>

            <Link href="/anunciar-carro-bh" className="rounded-3xl bg-[#f5f5f3] border border-black/5 p-6 transition-all hover:-translate-y-1 hover:bg-dark hover:text-white group">
              <div className="flex items-center gap-3 text-dark group-hover:text-white transition-colors">
                <CarFront className="h-5 w-5" />
                <span className="text-base font-black">Anunciar carro</span>
              </div>
              <p className="mt-2 text-sm font-medium text-dark/50 group-hover:text-white/60 transition-colors">Publicar novo anúncio em poucos passos.</p>
            </Link>

            <Link href="/entrar" className="rounded-3xl bg-[#f5f5f3] border border-black/5 p-6 transition-all hover:-translate-y-1 hover:bg-dark hover:text-white group">
              <div className="flex items-center gap-3 text-dark group-hover:text-white transition-colors">
                <UserRound className="h-5 w-5" />
                <span className="text-base font-black">Login / Segurança</span>
              </div>
              <p className="mt-2 text-sm font-medium text-dark/50 group-hover:text-white/60 transition-colors">Entrar ou trocar de conta.</p>
            </Link>
          </div>
        </section>

        <div className="mt-6">
          <ProfilePanel />
        </div>
      </div>
    </main>
  )
}
