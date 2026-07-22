'use client'

import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { BenefitGrid, SEOSection, FAQSection, SEOCallToAction } from './SEOContentSection'

interface SEOPageClientProps {
  data: any
  ctaHref: string
}

export default function SEOPageClient({ data, ctaHref }: SEOPageClientProps) {
  return (
    <div className="fingen-shell">
      {/* Hero Section */}
      <section className="fingen-dark-hero" style={{ textAlign: 'center' }}>
        <div className="fingen-shell-content" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="fingen-breadcrumb" style={{ justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.5)' }}>Home</Link>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
              <span style={{ color: '#fff' }}>{data.h1}</span>
            </div>
            <h1 className="text-balance">
              {data.h1}
            </h1>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>
              {data.subtitle}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '28px', flexWrap: 'wrap' }}>
              <Link
                href={ctaHref}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent)', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '15px', textDecoration: 'none', transition: 'all 0.2s ease' }}
              >
                {data.ctaButtonText || 'Começar agora'} <ArrowRight size={16} />
              </Link>
              <a
                href="#detalhes"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: 'var(--radius-full)', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: '15px', textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.2)', transition: 'all 0.2s ease' }}
              >
                Saber mais
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <div id="detalhes">
        <BenefitGrid items={data.benefits} />

        {data.sections.map((section: any, idx: number) => (
          <SEOSection
            key={idx}
            badge={section.badge}
            title={section.title}
            subtitle={section.subtitle}
            reversed={idx % 2 !== 0}
            dark={idx % 2 !== 0}
          >
            <p>{section.content}</p>
          </SEOSection>
        ))}
      </div>

      <FAQSection items={data.faqs} />

      <SEOCallToAction
        title={data.bottomCtaTitle || "Pronto para negociar seu veículo?"}
        description={data.bottomCtaDescription || "Junte-se a milhares de motoristas que já simplificaram sua vida com a Carbi."}
        buttonText={data.bottomCtaButtonText || "Começar hoje"}
        buttonHref={ctaHref}
      />
    </div>
  )
}
