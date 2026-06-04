import Link from 'next/link'
import { CarFront, ShieldCheck } from 'lucide-react'

const NAV_GROUPS = [
  {
    title: 'Comprar',
    links: [
      { href: '/carros-a-venda', label: 'Todos os anúncios' },
      { href: '/carros/mais-baratos', label: 'Mais baratos' },
      { href: '/carros/suv', label: 'SUVs' },
      { href: '/carros/automaticos', label: 'Automáticos' },
      { href: '/caminhoes', label: 'Caminhões' },
    ],
  },
  {
    title: 'Vender',
    links: [
      { href: '/anunciar-carro', label: 'Anunciar grátis' },
      { href: '/anunciar-carro/fluxo', label: 'Venda direta' },
      { href: '/vender-carro', label: 'Venda rápida' },
    ],
  },
  {
    title: 'Descobrir',
    links: [
      { href: '/marcas', label: 'Marcas' },
      { href: '/qual-carro', label: 'Qual carro comprar' },
      { href: '/rankings', label: 'Rankings' },
      { href: '/categorias', label: 'Categorias' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { href: '/minha-conta', label: 'Minha conta' },
      { href: '/entrar', label: 'Entrar' },
    ],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-[#EAEAE8]">
      <div className="container py-16 md:py-24">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-y-12 gap-x-8 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 17L7 8H17L19 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="8" cy="19" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="19" r="1.5" fill="currentColor"/>
              </svg>
              <span className="text-[17px] font-semibold tracking-tight text-[#0A0A0A]">carbi</span>
            </Link>
            <p className="text-[15px] text-[#525252] leading-relaxed max-w-xs mb-6">
              O marketplace automotivo premium do Brasil. Dados reais, decisões inteligentes.
            </p>
            <div className="flex items-center gap-2 text-[13px] text-[#525252]">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" strokeWidth={1.75} />
              <span>Dados verificados com FIPE</span>
            </div>
          </div>

          {/* Link Columns */}
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-[13px] font-semibold text-[#0A0A0A] mb-4 tracking-tight">
                {group.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {group.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[14px] text-[#525252] hover:text-[#0A0A0A] transition-colors"
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
        <div className="pt-8 border-t border-[#EAEAE8] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-[#A3A3A3]">
            © {year} carbi. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-[13px] text-[#A3A3A3]">
            <Link href="#" className="hover:text-[#0A0A0A] transition-colors">Termos</Link>
            <Link href="#" className="hover:text-[#0A0A0A] transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-[#0A0A0A] transition-colors">Contato</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
