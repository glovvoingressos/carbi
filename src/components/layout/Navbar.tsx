'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [showBanner, setShowBanner] = useState(true)

  return (
    <>
      {showBanner && (
        <div className="top-banner" id="topBanner">
          <span>Anuncie seu carro <strong>grátis</strong> por tempo limitado —</span>
          <Link href="/anunciar-carro">Criar anúncio agora</Link>
          <button className="banner-close" onClick={() => setShowBanner(false)} aria-label="Fechar aviso">×</button>
        </div>
      )}
      <nav className="ref-nav" aria-label="Navegação principal">
        <Link href="/" className="ref-nav-logo">car<span>bi</span></Link>
        <div className="ref-nav-links">
          <Link href="/carros-a-venda">Comprar</Link>
          <Link href="/anunciar-carro">Vender</Link>
          <Link href="/marcas">Marcas</Link>
          <Link href="/qual-carro">Qual carro?</Link>
          <Link href="/rankings">FIPE</Link>
        </div>
        <div className="ref-nav-buttons">
          <Link href="/entrar" className="ref-btn ref-btn-ghost">Entrar</Link>
          <Link href="/anunciar-carro" className="ref-btn ref-btn-forest">Anunciar grátis</Link>
        </div>
      </nav>
    </>
  )
}
