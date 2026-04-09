import Link from 'next/link'
import { CarFront, ArrowUpRight } from 'lucide-react'

const NAV_LINKS = [
  { group: 'Plataforma', links: [
    { href: '/',         label: 'Início' },
    { href: '/marcas',   label: 'Marcas' },
    { href: '/rankings', label: 'Rankings' },
  ]},
  { group: 'Ferramentas', links: [
    { href: '/qual-carro', label: 'Qual Carro?' },
    { href: '/comparar',   label: 'Comparador' },
  ]},
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
      <div className="container" style={{ paddingBlock: 'clamp(48px, 6vh, 72px)' }}>

        {/* Grid 4 colunas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'clamp(32px, 5vw, 64px)',
            marginBottom: 48,
          }}
        >
          {/* Coluna: marca */}
          <div style={{ gridColumn: 'span 2' }} className="footer-brand-col">
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 36, height: 36,
                  borderRadius: 10,
                  background: 'var(--color-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CarFront style={{ width: 18, height: 18, color: '#fff' }} />
              </div>
              <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Car<span style={{ color: 'var(--color-accent)' }}>bi</span>
              </span>
            </Link>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-2)', maxWidth: 280 }}>
              O guia automotivo mais completo do Brasil. Compare carros, descubra seu perfil e tome a melhor decisão de compra com dados reais.
            </p>

            {/* Selos / trust */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {['Dados reais', 'Atualizado hoje', 'Sem anúncios'].map((label) => (
                <span
                  key={label}
                  style={{
                    fontSize: 11, fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-2)',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Colunas de links */}
          {NAV_LINKS.map(({ group, links }) => (
            <div key={group}>
              <p
                style={{
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: 'var(--color-text-3)', marginBottom: 16,
                }}
              >
                {group}
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      style={{
                        fontSize: 14, fontWeight: 500,
                        color: 'var(--color-text-2)',
                        transition: 'color 150ms ease',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-2)' }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Linha final */}
        <div
          style={{
            paddingTop: 24,
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
            © {year} Carbi — Dados oficiais e comparativos inteligentes.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
            Feito com ❤️ no Brasil
          </p>
        </div>

      </div>
    </footer>
  )
}
