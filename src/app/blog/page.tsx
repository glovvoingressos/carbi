import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock, TrendingUp, Car, DollarSign, Shield, Fuel } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog | Carbi',
  description: 'Dicas, comparativos e análises sobre o mercado de seminovos no Brasil. Decida com dados reais.',
}

const posts = [
  {
    id: 'como-escolher-seminovo',
    title: 'Como escolher o seminovo ideal em 2026',
    excerpt: 'Guia completo com dicas práticas para comprar um seminovo com confiança, sem surpresas.',
    category: 'Guia',
    readTime: '5 min',
    icon: Car,
    color: '#D4F576',
    featured: true,
  },
  {
    id: 'fipe-como-funciona',
    title: 'Tabela FIPE: como funciona e por que importa',
    excerpt: 'Entenda como a FIPE calcula os preços e como usar isso a seu favor na negociação.',
    category: 'Mercado',
    readTime: '4 min',
    icon: DollarSign,
    color: '#93C5FD',
    featured: false,
  },
  {
    id: 'carros-menos-desvalorizam',
    title: 'Quais carros menos desvalorizam no Brasil?',
    excerpt: 'Análise dos modelos que mantêm o valor de revenda e protegem seu investimento.',
    category: 'Ranking',
    readTime: '6 min',
    icon: TrendingUp,
    color: '#C9B8FF',
    featured: false,
  },
  {
    id: 'documentos-compra',
    title: 'Documentos necessários para comprar um carro usado',
    excerpt: 'Checklist completo de documentos para transferência segura e sem burocracia.',
    category: 'Guia',
    readTime: '3 min',
    icon: Shield,
    color: '#39E09B',
    featured: false,
  },
  {
    id: 'eletricos-vs-combustao',
    title: 'Elétrico vs Combustão: o que faz mais sentido?',
    excerpt: 'Comparativo completo de custos, manutenção e economia a longo prazo.',
    category: 'Comparativo',
    readTime: '7 min',
    icon: Fuel,
    color: '#FF6B52',
    featured: false,
  },
  {
    id: 'vender-carro-rapido',
    title: 'Como vender seu carro rápido e pelo melhor preço',
    excerpt: 'Estratégias comprovadas para vender mais rápido e não perder dinheiro.',
    category: 'Dica',
    readTime: '4 min',
    icon: TrendingUp,
    color: '#D4F576',
    featured: false,
  },
]

export default function BlogPage() {
  const featured = posts.find(p => p.featured)
  const otherPosts = posts.filter(p => !p.featured)

  return (
    <div className="fingen-page">
      <main className="fingen-main">
        {/* Hero */}
        <section className="blog-hero">
          <div className="blog-hero-inner">
            <h1 className="blog-hero-title">
              Blog
            </h1>
            <p className="blog-hero-sub">
              Dicas, comparativos e análises para você decidir com dados reais.
            </p>
          </div>
        </section>

        {/* Featured Post */}
        {featured && (
          <section className="blog-featured">
            <Link href={`/blog/${featured.id}`} className="blog-featured-card">
              <div className="blog-featured-content">
                <div className="blog-featured-meta">
                  <span className="blog-featured-category" style={{ background: `${featured.color}15`, color: featured.color }}>
                    {featured.category}
                  </span>
                  <span className="blog-featured-time">
                    <Clock size={14} />
                    {featured.readTime}
                  </span>
                </div>
                <h2 className="blog-featured-title">{featured.title}</h2>
                <p className="blog-featured-excerpt">{featured.excerpt}</p>
                <span className="blog-featured-link">
                  Ler artigo
                  <ArrowRight size={16} />
                </span>
              </div>
              <div className="blog-featured-icon">
                <featured.icon size={48} />
              </div>
            </Link>
          </section>
        )}

        {/* Posts Grid */}
        <section className="blog-grid-section">
          <div className="blog-grid-header">
            <h2 className="blog-grid-title">Últimos artigos</h2>
          </div>
          <div className="blog-grid">
            {otherPosts.map((post) => (
              <Link href={`/blog/${post.id}`} key={post.id} className="blog-card">
                <div className="blog-card-icon" style={{ background: `${post.color}15`, color: post.color }}>
                  <post.icon size={20} />
                </div>
                <div className="blog-card-content">
                  <div className="blog-card-meta">
                    <span className="blog-card-category">{post.category}</span>
                    <span className="blog-card-time">
                      <Clock size={12} />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                </div>
                <div className="blog-card-arrow">
                  <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="blog-cta">
          <div className="blog-cta-card">
            <h2>Pronto para encontrar seu carro?</h2>
            <p>Use nossos dados e encontre o melhor negócio.</p>
            <Link href="/carros-a-venda" className="blog-cta-btn">
              Explorar anúncios
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
