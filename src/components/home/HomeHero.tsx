import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MessageCircle, TrendingUp, Truck } from 'lucide-react'
import { heroFont } from './home-font'
import '../../app/home-hero.css'

type HomeHeroProps = {
  listingCount: number
  cityCount: number
  brandCount: number
}

export default function HomeHero({ listingCount, cityCount, brandCount }: HomeHeroProps) {
  const stats = [
    { value: listingCount, label: 'anúncios publicados' },
    { value: cityCount, label: 'cidades' },
    { value: brandCount, label: 'marcas' },
  ].filter((stat) => stat.value > 0)

  return (
    <section className={`hh ${heroFont.variable}`} aria-labelledby="home-hero-title">
      <div className="hh-grid">
        <div className="hh-left">
          <h1 id="home-hero-title" className="hh-title">
            Encontre o carro certo com 100% de clareza
          </h1>

          <Link href="/carros-a-venda" className="hh-cta">
            Ver carros à venda
            <span className="hh-cta-circle" aria-hidden="true">
              <ArrowRight size={18} />
            </span>
          </Link>

          <div className="hh-cards">
            <Link href="/qual-carro" className="hh-card hh-card-orange">
              <span className="hh-card-icon" aria-hidden="true"><TrendingUp size={18} /></span>
              <span className="hh-card-title">Compare com a FIPE</span>
              <span className="hh-card-sub">Saiba se o preço está justo</span>
              <ArrowRight className="hh-card-arrow" size={22} aria-hidden="true" />
            </Link>

            <div className="hh-card hh-card-grey">
              <span className="hh-chip">Online</span>
              <span className="hh-card-title">Chat interno</span>
              <span className="hh-card-sub">
                <MessageCircle size={14} aria-hidden="true" /> Negocie sem expor seu telefone
              </span>
            </div>

            <Link href="/caminhoes" className="hh-card hh-card-truck">
              <span className="hh-card-icon" aria-hidden="true"><Truck size={18} /></span>
              <span className="hh-card-title">Caminhões à venda</span>
              <span className="hh-card-sub">Truck, bitruck, cavalo mecânico e toco</span>
              <ArrowRight className="hh-card-arrow" size={22} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="hh-right">
          <div className="hh-photo">
            <Image
              src="/images/porsche-gt3-studio.jpg"
              alt="Porsche 911 GT3 preto em estúdio branco, imagem ilustrativa"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 46vw"
            />
            <Link href="/anunciar-carro" className="hh-badge">
              Anuncie<br />grátis
            </Link>
          </div>

          {stats.length > 0 ? (
            <div className="hh-stats" role="list">
              {stats.map((stat) => (
                <div key={stat.label} className="hh-stat" role="listitem">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}

          <Link href="#pesquise-placa" className="hh-banner">
            <span>Pesquise pela placa</span>
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
