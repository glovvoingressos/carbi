import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, TrendingUp, Target, BarChart3, Users, Zap, Shield, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tráfego Pago Grátis | Carbi',
  description: 'Anuncie seu carro na Carbi e receba tráfego pago grátis no Google e Meta Ads. Seus anúncios chegam a milhares de compradores sem custo.',
  openGraph: {
    title: 'Tráfego Pago Grátis | Carbi',
    description: 'Anuncie seu carro na Carbi e receba tráfego pago grátis no Google e Meta Ads.',
  },
}

export default function TrafegoPagoPage() {
  return (
    <div className="fingen-page">
      <main className="fingen-main">
        {/* Hero */}
        <section className="tfp-hero">
          <div className="tfp-hero-inner">
            <div className="tfp-hero-content">
              <div className="tfp-badge">
                <Zap size={14} />
                Tráfego pago incluso
              </div>
              <h1 className="tfp-hero-title">
                Seu anúncio
                <br />
                <span className="tfp-hero-accent">chega a milhares</span>
                <br />
                sem custo
              </h1>
              <p className="tfp-hero-sub">
                Anuncie seu carro na Carbi e receba tráfego pago grátis no Google e Meta Ads.
                Seus anúncios chegam a compradores reais, sem você pagar nada além do anúncio.
              </p>
              <div className="tfp-hero-actions">
                <Link href="/anunciar-carro" className="tfp-btn-primary">
                  Começar agora
                  <ArrowRight size={18} />
                </Link>
                <Link href="#como-funciona" className="tfp-btn-secondary">
                  Como funciona
                </Link>
              </div>
            </div>
            <div className="tfp-hero-visual">
              <div className="tfp-hero-card tfp-hero-card-1">
                <div className="tfp-hero-card-icon">
                  <Target size={20} />
                </div>
                <div>
                  <div className="tfp-hero-card-title">Google Ads</div>
                  <div className="tfp-hero-card-desc">Apareça para quem busca</div>
                </div>
              </div>
              <div className="tfp-hero-card tfp-hero-card-2">
                <div className="tfp-hero-card-icon tfp-hero-card-icon-purple">
                  <Users size={20} />
                </div>
                <div>
                  <div className="tfp-hero-card-title">Meta Ads</div>
                  <div className="tfp-hero-card-desc">Alcance compradores no feed</div>
                </div>
              </div>
              <div className="tfp-hero-card tfp-hero-card-3">
                <div className="tfp-hero-card-icon tfp-hero-card-icon-green">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div className="tfp-hero-card-title">+2.4k contatos</div>
                  <div className="tfp-hero-card-desc">Média por anúncio ativo</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="tfp-stats">
          <div className="tfp-stats-grid">
            <div className="tfp-stat">
              <div className="tfp-stat-number">100%</div>
              <div className="tfp-stat-label">Grátis</div>
            </div>
            <div className="tfp-stat-divider" />
            <div className="tfp-stat">
              <div className="tfp-stat-number">Google</div>
              <div className="tfp-stat-label">+ Meta Ads</div>
            </div>
            <div className="tfp-stat-divider" />
            <div className="tfp-stat">
              <div className="tfp-stat-number">5mil+</div>
              <div className="tfp-stat-label">Compradores ativos</div>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section className="tfp-section" id="como-funciona">
          <div className="tfp-section-header">
            <div className="tfp-section-label">Como funciona</div>
            <h2 className="tfp-section-title">Simples, rápido e gratuito</h2>
            <p className="tfp-section-sub">Em 3 passos, seu carro chega a milhares de compradores interessados.</p>
          </div>
          <div className="tfp-steps">
            <div className="tfp-step">
              <div className="tfp-step-number">01</div>
              <div className="tfp-step-content">
                <h3>Anuncie seu carro</h3>
                <p>Cadastre seu veículo com fotos, preço e dados da FIPE. O processo leva menos de 2 minutos.</p>
              </div>
            </div>
            <div className="tfp-step">
              <div className="tfp-step-number">02</div>
              <div className="tfp-step-content">
                <h3>Aprovamos seu anúncio</h3>
                <p>Nossa equipe verifica a qualidade das fotos e dos dados. Aprovação em até 24 horas.</p>
              </div>
            </div>
            <div className="tfp-step">
              <div className="tfp-step-number">03</div>
              <div className="tfp-step-content">
                <h3>Divulgamos grátis</h3>
                <p>Seu anúncio é divulgado no Google Ads e Meta Ads sem custo algum para você.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="tfp-section tfp-benefits">
          <div className="tfp-section-header">
            <div className="tfp-section-label">Benefícios</div>
            <h2 className="tfp-section-title">Por que anunciar na Carbi?</h2>
          </div>
          <div className="tfp-benefits-grid">
            <div className="tfp-benefit">
              <div className="tfp-benefit-icon">
                <TrendingUp size={20} />
              </div>
              <h3>Tráfego qualificado</h3>
              <p>Seus anúncios chegam a pessoas que realmente estão buscando comprar um carro.</p>
            </div>
            <div className="tfp-benefit">
              <div className="tfp-benefit-icon tfp-benefit-icon-purple">
                <BarChart3 size={20} />
              </div>
              <h3>Dados reais</h3>
              <p>Compare com a FIPE, veja histórico do veículo e tenha dados transparentes.</p>
            </div>
            <div className="tfp-benefit">
              <div className="tfp-benefit-icon tfp-benefit-icon-green">
                <Shield size={20} />
              </div>
              <h3>Segurança</h3>
              <p>Chat interno, sem compartilhar telefone. Negocie com segurança direto pela plataforma.</p>
            </div>
            <div className="tfp-benefit">
              <div className="tfp-benefit-icon tfp-benefit-icon-orange">
                <Zap size={20} />
              </div>
              <h3>Rápido</h3>
              <p>Anuncie em menos de 2 minutos e comece a receber contatos no mesmo dia.</p>
            </div>
          </div>
        </section>

        {/* Comparativo */}
        <section className="tfp-section">
          <div className="tfp-section-header">
            <div className="tfp-section-label">Comparativo</div>
            <h2 className="tfp-section-title">Carbi vs. Outros</h2>
          </div>
          <div className="tfp-compare">
            <div className="tfp-compare-card tfp-compare-old">
              <div className="tfp-compare-header">Outros sites</div>
              <ul className="tfp-compare-list">
                <li className="tfp-compare-item old">
                  <span className="tfp-compare-x">✕</span>
                  Tráfego pago por sua conta
                </li>
                <li className="tfp-compare-item old">
                  <span className="tfp-compare-x">✕</span>
                  Sem dados da FIPE
                </li>
                <li className="tfp-compare-item old">
                  <span className="tfp-compare-x">✕</span>
                  Contato direto por telefone
                </li>
                <li className="tfp-compare-item old">
                  <span className="tfp-compare-x">✕</span>
                  Sem verificação de dados
                </li>
              </ul>
            </div>
            <div className="tfp-compare-card tfp-compare-new">
              <div className="tfp-compare-header">Carbi</div>
              <ul className="tfp-compare-list">
                <li className="tfp-compare-item new">
                  <Check size={16} />
                  Tráfego pago grátis
                </li>
                <li className="tfp-compare-item new">
                  <Check size={16} />
                  Dados FIPE verificados
                </li>
                <li className="tfp-compare-item new">
                  <Check size={16} />
                  Chat interno seguro
                </li>
                <li className="tfp-compare-item new">
                  <Check size={16} />
                  Verificação de qualidade
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="tfp-section">
          <div className="tfp-section-header">
            <div className="tfp-section-label">Dúvidas</div>
            <h2 className="tfp-section-title">Perguntas frequentes</h2>
          </div>
          <div className="tfp-faq">
            <div className="tfp-faq-item">
              <h3>É realmente grátis?</h3>
              <p>Sim. A Carbi arca com todos os custos de tráfego pago no Google e Meta Ads. Você só paga por seu anúncio, sem taxas adicionais.</p>
            </div>
            <div className="tfp-faq-item">
              <h3>Como funciona a divulgação?</h3>
              <p>Seu anúncio é otimizado e divulgado automaticamente para compradores na sua região, com segmentação por marca, modelo e faixa de preço.</p>
            </div>
            <div className="tfp-faq-item">
              <h3>Quanto tempo leva para aprovar?</h3>
              <p>A aprovação leva em média 24 horas. Verificamos a qualidade das fotos e a veracidade dos dados antes de publicar.</p>
            </div>
            <div className="tfp-faq-item">
              <h3>Posso remover o anúncio depois?</h3>
              <p>Sim. Você pode pausar ou remover seu anúncio a qualquer momento, sem multas ou compromissos.</p>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="tfp-final-cta">
          <div className="tfp-final-cta-card">
            <h2>Pronto para vender?</h2>
            <p>Anuncie seu carro grátis e comece a receber contatos de compradores reais hoje.</p>
            <Link href="/anunciar-carro" className="tfp-btn-primary tfp-btn-large">
              Anunciar agora
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
