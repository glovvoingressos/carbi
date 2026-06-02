import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const NAV_LINKS = [
  { group: 'Plataforma', links: [
    { href: '/',         label: 'Início' },
    { href: '/carros-a-venda', label: 'Comprar Carros' },
    { href: '/caminhoes', label: 'Caminhões' },
    { href: '/marcas',   label: 'Marcas' },
    { href: '/rankings', label: 'Rankings' },
  ]},
  { group: 'Vender', links: [
    { href: '/anunciar-carro', label: 'Anunciar Carro' },
    { href: '/anunciar-carro/fluxo', label: 'Venda Direta' },
    { href: '/anunciar-seminovo', label: 'Anunciar Seminovo' },
    { href: '/vender-carro-rapido', label: 'Venda Rápida' },
  ]},
  { group: 'Ferramentas', links: [
    { href: '/qual-carro', label: 'Qual Carro?' },
    { href: '/melhor-carro-aplicativo', label: 'Melhor Carro Uber' },
  ]},
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-black/5 mt-auto">
      <div className="container py-16 md:py-24">

        {/* Grid 4 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Coluna: marca */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-flex items-center">
              <span className="font-display text-3xl font-black text-gradient tracking-tighter hover:opacity-80 transition-opacity">
                carbi
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-dark/60 max-w-sm">
              O ecossistema automotivo premium do Brasil. Compare carros, descubra seu perfil e tome a melhor decisão de compra com dados oficiais e interface intuitiva.
            </p>

            {/* Selos / trust */}
            <div className="flex flex-wrap gap-2 pt-2">
              {['Dados reais', 'Atualizado hoje', 'Sem anúncios'].map((label) => (
                <span
                  key={label}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-dark/60 bg-[#F7F8FA] border border-black/5 rounded-full"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Colunas de links */}
          {NAV_LINKS.map(({ group, links }) => (
            <div key={group} className="space-y-6">
              <h4 className="text-[11px] font-black tracking-[0.1em] uppercase text-dark/40">
                {group}
              </h4>
              <ul className="flex flex-col gap-4">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm font-semibold text-dark/60 hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                    >
                      {label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Linha final */}
        <div className="pt-8 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-semibold text-dark/40">
            © {year} carbi — Premium Automotive Experience.
          </p>
          <div className="flex items-center gap-6 text-xs font-semibold text-dark/40">
            <span className="hover:text-dark transition-colors cursor-pointer">Termos</span>
            <span className="hover:text-dark transition-colors cursor-pointer">Privacidade</span>
            <span>Feito com ❤️ no Brasil</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
