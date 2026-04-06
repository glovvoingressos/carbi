import Link from 'next/link'
import { CarFront } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                <CarFront className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-text">
                CarDecision<span className="text-primary">.br</span>
              </span>
            </div>
            <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
              Compare carros, descubra o melhor para seu perfil e tome a melhor decis&atilde;o de compra.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Navega&ccedil;&atilde;o</h4>
              <ul className="space-y-1.5 text-sm">
                <li><Link href="/" className="text-text-secondary hover:text-primary transition-colors">Home</Link></li>
                <li><Link href="/marcas" className="text-text-secondary hover:text-primary transition-colors">Marcas</Link></li>
                <li><Link href="/rankings" className="text-text-secondary hover:text-primary transition-colors">Rankings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Ferramentas</h4>
              <ul className="space-y-1.5 text-sm">
                <li><Link href="/qual-carro" className="text-text-secondary hover:text-primary transition-colors">Qual Carro?</Link></li>
                <li><Link href="/comparar" className="text-text-secondary hover:text-primary transition-colors">Comparador</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-text-tertiary">
          Dados baseados em especifica&ccedil;&otilde;es oficiais dos fabricantes. &copy; {new Date().getFullYear()} CarDecision.br
        </div>
      </div>
    </footer>
  )
}
