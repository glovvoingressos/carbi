import Link from 'next/link'
import { CarFront } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="hidden md:block py-10" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className="p-8 flex flex-col md:flex-row md:items-start md:justify-between gap-8"
          style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--color-border)' }}
        >
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-dark)' }}>
                <CarFront className="w-4 h-4 text-white" />
              </div>
              <span className="text-[15px] font-bold">
                Car<span style={{ color: 'var(--color-accent)' }}>Decision</span>
              </span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
              Compare carros, descubra o melhor para seu perfil e tome a melhor decisão de compra com dados reais.
            </p>
          </div>

          <div className="flex gap-14">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-3)' }}>
                Navegação
              </h4>
              <ul className="space-y-2">
                {[
                  { href: '/', label: 'Início' },
                  { href: '/marcas', label: 'Marcas' },
                  { href: '/rankings', label: 'Rankings' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[13px] font-medium hover:opacity-60 transition-opacity" style={{ color: 'var(--color-text-2)' }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-3)' }}>
                Ferramentas
              </h4>
              <ul className="space-y-2">
                {[
                  { href: '/qual-carro', label: 'Qual Carro?' },
                  { href: '/comparar', label: 'Comparador' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[13px] font-medium hover:opacity-60 transition-opacity" style={{ color: 'var(--color-text-2)' }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: 'var(--color-text-3)' }}>
          © {new Date().getFullYear()} CarDecision.br — Dados baseados em especificações oficiais dos fabricantes.
        </p>
      </div>
    </footer>
  )
}
