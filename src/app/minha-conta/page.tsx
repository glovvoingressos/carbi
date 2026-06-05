import Link from 'next/link'
import type { Metadata } from 'next'
import { LayoutDashboard, MessageCircle, CarFront, UserRound } from 'lucide-react'
import ProfilePanel from '@/components/marketplace/ProfilePanel'

export const metadata: Metadata = {
  title: 'Minha conta | Carbi',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MinhaContaPage() {
  return (
    <main className="min-h-screen pb-16 pt-28">
      <div className="container max-w-4xl">
        <section className="hero-bento p-8 sm:p-12">
          <p className="section-kicker">Minha conta</p>
          <h1 className="mt-3 text-balance">Seu painel de perfil</h1>
          <p className="mt-3 text-lg font-medium text-[#52607A]">
            Acesse seus anúncios, chats e ação rápida para publicar um novo veículo.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link href="/minha-conta/anuncios" className="surface p-6 transition-all hover:-translate-y-1 hover:border-[#17170F]/30 hover:bg-[#D9F85F] group">
              <div className="flex items-center gap-3 text-[#0A0A0A] group-hover:text-white transition-colors">
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-base font-black">Meus anúncios</span>
              </div>
              <p className="mt-2 text-sm font-medium text-[#52607A] group-hover:text-[#52607A] transition-colors">Editar fotos, preço e descrição.</p>
            </Link>

            <Link href="/minha-conta/conversas" className="surface p-6 transition-all hover:-translate-y-1 hover:border-[#17170F]/30 hover:bg-[#D9F85F] group">
              <div className="flex items-center gap-3 text-[#0A0A0A] group-hover:text-white transition-colors">
                <MessageCircle className="h-5 w-5" />
                <span className="text-base font-black">Meus chats</span>
              </div>
              <p className="mt-2 text-sm font-medium text-[#52607A] group-hover:text-[#52607A] transition-colors">Acompanhar conversas com compradores.</p>
            </Link>

            <Link href="/anunciar-carro" className="surface p-6 transition-all hover:-translate-y-1 hover:border-[#17170F]/30 hover:bg-[#D9F85F] group">
              <div className="flex items-center gap-3 text-[#0A0A0A] group-hover:text-white transition-colors">
                <CarFront className="h-5 w-5" />
                <span className="text-base font-black">Anunciar carro</span>
              </div>
              <p className="mt-2 text-sm font-medium text-[#52607A] group-hover:text-[#52607A] transition-colors">Publicar novo anúncio em poucos passos.</p>
            </Link>

            <Link href="/entrar" className="surface p-6 transition-all hover:-translate-y-1 hover:border-[#17170F]/30 hover:bg-[#D9F85F] group">
              <div className="flex items-center gap-3 text-[#0A0A0A] group-hover:text-white transition-colors">
                <UserRound className="h-5 w-5" />
                <span className="text-base font-black">Login / Segurança</span>
              </div>
              <p className="mt-2 text-sm font-medium text-[#52607A] group-hover:text-[#52607A] transition-colors">Entrar ou trocar de conta.</p>
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
