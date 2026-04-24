import { Metadata } from 'next'
import SEOPageClient from '@/components/seo/SEOPageClient'
import { Zap, ShieldCheck, MapPin, MessageCircle, Star, BadgeCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Anunciar Carro em BH: Venda rápido em Belo Horizonte | Carbi',
  description: 'O melhor lugar para anunciar seu carro em BH. Venda seu seminovo ou usado em Belo Horizonte com segurança, preço FIPE e sem pagar comissões abusivas.',
  keywords: ['anunciar carro bh', 'vender carro belo horizonte', 'carros usados bh', 'seminovos bh', 'onde vender carro em bh'],
  alternates: {
    canonical: 'https://carbi.com.br/anunciar-carro-bh'
  }
}

export default function AnunciarCarroBHPage() {
  const data = {
    h1: 'Anunciar Carro em BH nunca foi tão simples',
    subtitle: 'A Carbi é a plataforma oficial de quem quer vender carro em Belo Horizonte e região metropolitana sem burocracia.',
    ctaButtonText: 'Anunciar em BH agora',
    benefits: [
      { icon: MapPin, title: 'Foco Total em BH', description: 'Seu anúncio é mostrado prioritariamente para compradores de Belo Horizonte, Contagem e Betim.' },
      { icon: BadgeCheck, title: 'Preço Real de BH', description: 'Ajustamos as sugestões de preço com base no mercado local de Minas Gerais.' },
      { icon: MessageCircle, title: 'Chat Seguro', description: 'Negocie com mineiros de forma segura, sem expor seus dados pessoais antes da hora.' }
    ],
    sections: [
      {
        badge: 'Guia Local',
        title: 'Melhor lugar para vender carro em BH',
        subtitle: 'Belo Horizonte é um dos maiores polos automotivos do país.',
        content: `Se você está procurando onde anunciar carro em BH, a Carbi oferece a melhor visibilidade local. Diferente de sites nacionais genéricos, nós entendemos o público de Belo Horizonte, que valoriza a procedência e a segurança na negociação entre particulares.`
      },
      {
        badge: 'Processo',
        title: 'Como funciona a venda em BH via Carbi',
        subtitle: 'Vender seu carro rápido em Belo Horizonte exige 3 passos.',
        content: `1. Cadastre seu veículo informando a placa ou modelo. 2. Tire fotos em locais conhecidos de BH (como a Praça da Liberdade ou Mirante) para passar confiança. 3. Receba propostas via chat e agende a visita em locais públicos seguros da capital mineira.`
      },
      {
        badge: 'Vantagens',
        title: 'Por que não vender para lojistas em BH?',
        subtitle: 'Lojistas na Av. Raja Gabaglia ou Av. Barão Homem de Melo costumam pagar 20% a 30% abaixo da FIPE.',
        content: `Ao vender seu carro diretamente para outro particular na Carbi, você garante o valor integral da Tabela FIPE. Nós eliminamos o intermediário para que o lucro da venda fique todo com você.`
      }
    ],
    faqs: [
      { q: 'Qual o melhor site para vender carro em BH?', a: 'A Carbi vem se destacando em Belo Horizonte por oferecer uma experiência "Atrito Zero", focada em segurança e design moderno.' },
      { q: 'Como vender carro rápido em Belo Horizonte?', a: 'Anunciar com fotos de qualidade e ser transparente sobre o estado do veículo são as chaves para uma venda rápida na capital.' },
      { q: 'É seguro encontrar compradores em BH?', a: 'Sim, recomendamos sempre marcar encontros em locais públicos e movimentados de Belo Horizonte, como estacionamentos de shoppings ou supermercados.' }
    ],
    bottomCtaTitle: 'Pronto para desocupar a garagem em BH?',
    bottomCtaDescription: 'Milhares de belo-horizontinos estão procurando seu carro agora mesmo.',
    bottomCtaButtonText: 'Criar meu anúncio grátis'
  }

  return <SEOPageClient data={data} ctaHref="/anunciar-carro-bh/fluxo" />
}
