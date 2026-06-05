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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-36 pb-24 overflow-hidden">
        <div className="container max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="section-kicker mb-8">
              Atrito Zero • Marketplace Inteligente
            </span>
            <h1 className="text-balance mb-8">
              {data.h1}
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-[#52607A] max-w-3xl mx-auto mb-12 leading-relaxed">
              {data.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                href={ctaHref}
                className="h-16 px-8 rounded-full bg-[#17170F] text-[#FFFDF3] text-[15px] font-bold flex items-center justify-center hover:bg-[#2A2A1D] transition-all shadow-sm group"
              >
                {data.ctaButtonText || 'Começar agora'} <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#detalhes" 
                className="h-16 px-8 rounded-full bg-white border-2 border-[#17170F]/12 text-[#17170F] text-[15px] font-bold flex items-center justify-center hover:bg-[#D9F85F] hover:border-[#17170F]/30 transition-all shadow-sm"
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
