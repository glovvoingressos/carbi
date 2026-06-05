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
    <footer className="mt-8 border-t border-white/70 bg-white/60 backdrop-blur-2xl">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-y-12 gap-x-8 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#17170F] text-[#FFFDF3] shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 17L7 8H17L19 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="8" cy="19" r="1.5" fill="currentColor"/>
                  <circle cx="16" cy="19" r="1.5" fill="currentColor"/>
                </svg>
              </span>
              <span className="text-[17px] font-semibold tracking-tight text-[#0A0A0A]">carbi</span>
            </Link>
            <p className="text-[15px] text-[#52607A] leading-relaxed max-w-xs mb-6">
              Um marketplace automotivo premium com busca rápida, leitura clara e dados de mercado que ajudam a decidir com confiança.
            </p>
            <div className="inline-flex items-center gap-2 text-[13px] text-[#52607A] badge badge-outline">
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
                      className="text-[14px] text-[#52607A] hover:text-[#0A0A0A] transition-colors"
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
        <div className="pt-8 border-t border-white/70 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-[#8A95A8]">
            © {year} carbi. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-[13px] text-[#8A95A8]">
            <Link href="#" className="hover:text-[#0A0A0A] transition-colors">Termos</Link>
            <Link href="#" className="hover:text-[#0A0A0A] transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-[#0A0A0A] transition-colors">Contato</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
