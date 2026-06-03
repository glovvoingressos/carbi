import Link from 'next/link'

const NAV_LINKS = [
  {
    group: 'Plataforma',
    links: [
      { href: '/', label: 'Início' },
      { href: '/carros-a-venda', label: 'Comprar' },
      { href: '/caminhoes', label: 'Caminhões' },
      { href: '/marcas', label: 'Marcas' },
      { href: '/rankings', label: 'Rankings' },
    ],
  },
  {
    group: 'Vender',
    links: [
      { href: '/anunciar-carro', label: 'Anunciar' },
      { href: '/anunciar-carro/fluxo', label: 'Venda Direta' },
      { href: '/vender-carro-rapido', label: 'Venda Rápida' },
    ],
  },
  {
    group: 'Ferramentas',
    links: [
      { href: '/qual-carro', label: 'Descobrir Carro' },
      { href: '/melhor-carro-aplicativo', label: 'Melhor para App' },
    ],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-bg border-t border-border">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="font-display text-xl text-text-primary">
              carbi
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              O ecossistema automotivo premium do Brasil. Dados reais, decisões inteligentes.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {['Dados reais', 'Atualizado hoje', 'Sem anúncios'].map((label) => (
                <span
                  key={label}
                  className="px-3 py-1 text-[11px] font-semibold text-text-tertiary bg-bg-alt rounded-full"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {NAV_LINKS.map(({ group, links }) => (
            <div key={group} className="space-y-4">
              <h4 className="label">{group}</h4>
              <ul className="flex flex-col gap-3">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm font-medium text-text-secondary hover:text-accent transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-tertiary">
            &copy; {year} carbi &mdash; Premium Automotive Experience.
          </p>
          <div className="flex items-center gap-6 text-xs font-medium text-text-tertiary">
            <span className="hover:text-text-primary transition-colors cursor-pointer">Termos</span>
            <span className="hover:text-text-primary transition-colors cursor-pointer">Privacidade</span>
            <span>Feito com dedica&ccedil;&atilde;o no Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
