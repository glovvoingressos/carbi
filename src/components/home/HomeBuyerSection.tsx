import Link from 'next/link'
import {
  ArrowRight,
  ListFilter,
  Search,
  Scale,
} from 'lucide-react'

const BUYER_ACTIONS = [
  {
    href: '/carros-a-venda',
    title: 'Ver todos os anúncios',
    description: 'Filtre por marca, preço, ano e cidade.',
    icon: Search,
  },
  {
    href: '/procurar-meu-carro',
    title: 'Encontrar meu carro',
    description: 'Diga o que você procura e refine a busca.',
    icon: ListFilter,
  },
  {
    href: '/qual-carro',
    title: 'Comparar modelos',
    description: 'Compare especificações e referências de preço.',
    icon: Scale,
  },
] as const

export default function HomeBuyerSection() {
  return (
    <section className="cb-section-pad" aria-labelledby="home-buyer-title">
      <div className="cb-wrap">
        <div className="grid overflow-hidden rounded-[28px] border border-[var(--cb-line)] bg-[var(--cb-surface)] md:grid-cols-[minmax(230px,0.72fr)_minmax(0,1.28fr)]">
          <div className="flex flex-col justify-between gap-8 bg-[var(--cb-charcoal)] p-6 text-white sm:p-8 md:p-10">
            <div>
              <h2 id="home-buyer-title" className="cb-dark-heading m-0 text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">
                Comprar
              </h2>
              <p className="cb-dark-copy-muted mt-4 max-w-[28ch] text-sm leading-6">
                Um caminho simples para sair da dúvida e chegar ao carro certo.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-[var(--cb-accent)] px-3 py-1.5 text-xs font-bold text-[var(--cb-ink)]">
              Comece por onde fizer sentido
            </span>
          </div>

          <nav className="p-3 sm:p-4" aria-label="Opções para comprar um carro">
            {BUYER_ACTIONS.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex min-h-[92px] items-center gap-4 rounded-[20px] border-b border-[var(--cb-line)] px-4 py-5 text-[var(--cb-ink)] transition-[background-color,border-color,transform] duration-200 last:border-b-0 hover:bg-[var(--cb-bg-alt)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cb-iris)] focus-visible:ring-offset-2"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--cb-lime-soft)] text-[var(--cb-ink)] transition-transform duration-200 group-hover:scale-105">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-base font-bold leading-tight">{title}</strong>
                  <span className="mt-1 block text-sm leading-5 text-[var(--cb-ink-soft)]">{description}</span>
                </span>
                <ArrowRight size={19} aria-hidden="true" className="shrink-0 text-[var(--cb-ink-soft)] transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}
