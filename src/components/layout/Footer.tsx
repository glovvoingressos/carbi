import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="ref-footer">
      <div className="ref-footer-top">
        <div className="ref-footer-brand">
          <Link href="/" className="logo">car<span>bi</span></Link>
          <p>Um marketplace automotivo premium com busca rápida, leitura clara e dados de mercado que ajudam a decidir com confiança.</p>
          <div className="ref-footer-verified">✓ Dados verificados com FIPE</div>
        </div>
        <div className="ref-footer-cols">
          <div className="ref-footer-col">
            <h5>Comprar</h5>
            <Link href="/carros-a-venda">Todos os anúncios</Link>
            <Link href="/carros/mais-baratos">Mais baratos</Link>
            <Link href="/carros/suv">SUVs</Link>
            <Link href="/carros/automatico">Automáticos</Link>
            <Link href="/carros/eletrico">Elétricos</Link>
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
            <Link href="/melhor-carro-aplicativo">Blog</Link>
          </div>
          <div className="ref-footer-col">
            <h5>Empresa</h5>
            <Link href="/">Sobre o Carbi</Link>
            <Link href="/">Contato</Link>
            <Link href="/">Termos</Link>
            <Link href="/">Privacidade</Link>
          </div>
        </div>
      </div>
      <div className="ref-footer-bottom">
        <div className="ref-footer-legal">© 2026 Carbi. Todos os direitos reservados.</div>
        <div className="ref-footer-social">
          <Link href="/" className="ref-social-btn">in</Link>
          <Link href="/" className="ref-social-btn">ig</Link>
          <Link href="/" className="ref-social-btn">tw</Link>
          <Link href="/" className="ref-social-btn">wa</Link>
        </div>
      </div>
    </footer>
  )
}
