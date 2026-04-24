'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { BenefitGrid, SEOSection, FAQSection, SEOCallToAction } from './SEOContentSection'

interface SEOPageClientProps {
  data: any
  ctaHref: string
}

export default function SEOPageClient({ data, ctaHref }: SEOPageClientProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-48 pb-32 bg-[#f5f5f3] overflow-hidden">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-dark/5 text-dark/40 text-[10px] font-black uppercase tracking-widest mb-8">
              Atrito Zero • Marketplace Inteligente
            </span>
            <h1 className="text-5xl sm:text-[110px] font-black text-dark tracking-tighter leading-[0.85] mb-12">
              {data.h1}
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-dark/40 max-w-3xl mx-auto mb-16 leading-relaxed">
              {data.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                href={ctaHref}
                className="h-24 px-16 rounded-full bg-dark text-white text-lg font-black uppercase tracking-widest flex items-center justify-center hover:scale-105 transition-all shadow-2xl shadow-dark/20 group"
              >
                {data.ctaButtonText || 'Começar agora'} <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#detalhes" 
                className="h-24 px-16 rounded-full bg-white border border-black/5 text-dark text-lg font-black uppercase tracking-widest flex items-center justify-center hover:bg-[#f5f5f3] transition-all"
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
