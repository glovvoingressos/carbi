import Link from 'next/link'
import Logo from '@/components/ui/Logo'

export default function Footer() {
  return (
    <footer className="ref-footer">
      <div className="ref-footer-top">
        <div className="ref-footer-brand">
          <Link href="/" className="logo">
            <Logo height={112} light />
          </Link>
          <p>Um marketplace automotivo premium com busca rápida, leitura clara e dados de mercado que ajudam a decidir com confiança.</p>
          <div className="ref-footer-verified">✓ Dados verificados com FIPE</div>
        </div>
        <div className="ref-footer-cols">
          <div className="ref-footer-col">
            <h5>Comprar</h5>
            <Link href="/carros-a-venda">Todos os anúncios</Link>
            <Link href="/carros/mais-baratos">Mais baratos</Link>
            <Link href="/carros/suv">SUVs</Link>
            <Link href="/carros/automaticos">Automáticos</Link>
            <Link href="/carros/eletricos">Elétricos</Link>
          </div>
          <div className="ref-footer-col">
            <h5>Caminhões</h5>
            <Link href="/caminhoes">Caminhões à venda</Link>
            <Link href="/caminhoes/cavalo-mecanico">Cavalos mecânicos</Link>
            <Link href="/caminhoes/marcas">Marcas de caminhão</Link>
            <Link href="/caminhoes/categorias">Categorias</Link>
            <Link href="/vender-caminhao">Anunciar caminhão</Link>
          </div>
          <div className="ref-footer-col">
            <h5>Vender</h5>
            <Link href="/anunciar-carro">Anunciar grátis</Link>
            <Link href="/vender-carro">Venda direta</Link>
            <Link href="/anunciar-carro/fluxo">Planos Pro</Link>
          </div>
          <div className="ref-footer-col">
            <h5>Descobrir</h5>
            <Link href="/marcas">Marcas</Link>
            <Link href="/qual-carro">Qual carro comprar</Link>
            <Link href="/rankings">Tabela FIPE</Link>
            <Link href="/blog">Blog</Link>
          </div>
          <div className="ref-footer-col">
            <h5>Empresa</h5>
            <Link href="/sobre">Sobre o Carbi</Link>
            <Link href="/contato">Contato</Link>
            <Link href="/termos">Termos</Link>
            <Link href="/privacidade">Privacidade</Link>
          </div>
        </div>
      </div>
      <div className="ref-footer-bottom">
        <div className="ref-footer-legal">© 2026 Carbi. Todos os direitos reservados.</div>
        <div className="ref-footer-social">
          <a href="https://www.linkedin.com/company/carbi" target="_blank" rel="noopener noreferrer" className="ref-social-btn" aria-label="Carbi no LinkedIn">in</a>
          <a href="https://www.instagram.com/carbioficial" target="_blank" rel="noopener noreferrer" className="ref-social-btn" aria-label="Carbi no Instagram">ig</a>
          <a href="https://twitter.com/carbioficial" target="_blank" rel="noopener noreferrer" className="ref-social-btn" aria-label="Carbi no Twitter">tw</a>
        </div>
      </div>
    </footer>
  )
}
