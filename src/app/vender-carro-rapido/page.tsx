import type { Metadata } from 'next'
import SEOPageClient from '@/components/seo/SEOPageClient'

export const metadata: Metadata = {
  title: 'Como vender carro mais rápido: prepare seu anúncio | Carbi',
  description: 'Veja como informar versão, estado, preço e histórico do veículo para facilitar a avaliação de quem procura um carro. O prazo de venda varia.',
  keywords: ['vender carro rápido', 'como vender carro', 'anunciar carro'],
  alternates: { canonical: '/vender-carro-rapido' },
  openGraph: {
    title: 'Como vender carro mais rápido: prepare seu anúncio | Carbi',
    description: 'Orientações para criar um anúncio claro e facilitar a avaliação do veículo por interessados.',
    url: '/vender-carro-rapido',
    type: 'website',
  },
}

const data = {
  h1: 'Como preparar seu anúncio para vender o carro',
  subtitle: 'Não existe prazo garantido de venda. Informações completas ajudam interessados a avaliar o veículo e decidir se querem conversar.',
  ctaButtonText: 'Criar anúncio',
  benefits: [
    { icon: 'Car', title: 'Identificação correta', description: 'Informe marca, modelo, versão, ano-modelo e quilometragem conforme os documentos.' },
    { icon: 'BadgeDollarSign', title: 'Preço transparente', description: 'Diferencie o preço pedido da FIPE e use a referência apenas quando ano e versão coincidirem.' },
    { icon: 'MessageCircle', title: 'Contato pela plataforma', description: 'Responda às perguntas pelo chat interno antes de decidir se compartilha outro contato.' },
  ],
  sections: [
    {
      badge: 'Ficha',
      title: 'Preencha os dados e conte o que o comprador precisa saber',
      subtitle: 'Evite omissões e informações que não possa confirmar.',
      content: 'Descreva estado, quilometragem, itens e avarias conhecidos. Informe revisões ou reparos com datas e comprovantes quando tiver. Para preço, compare anúncios de versão e ano semelhantes; a FIPE é uma referência e não garante o valor final.',
    },
    {
      badge: 'Fotos',
      title: 'Use fotos atuais e legíveis',
      subtitle: 'Mostre o veículo por fora e por dentro.',
      content: 'Fotografe o carro limpo, em local iluminado, incluindo laterais, frente, traseira, painel, bancos e detalhes de desgaste. Não use imagens de outro veículo nem esconda avarias relevantes. A conta permite até 5 anúncios ativos, com até 10 fotos por anúncio.',
    },
    {
      badge: 'Negociação',
      title: 'Organize a conversa e a visita',
      subtitle: 'Combine os próximos passos com atenção.',
      content: 'Responda às perguntas com os dados que tem, combine visita em local público e confira pagamento e transferência antes de entregar o carro. O prazo depende do preço, do veículo, da procura e das condições acordadas entre as partes.',
    },
  ],
  faqs: [
    { q: 'Quanto tempo demora para vender?', a: 'Não há prazo garantido. O tempo depende do preço pedido, do estado e da procura pelo veículo, além da negociação entre as partes.' },
    { q: 'Devo anunciar pelo valor FIPE?', a: 'A FIPE é uma referência. Confira se ano e versão coincidem, mostre mês e origem da consulta e compare com veículos semelhantes. O vendedor define o preço pedido.' },
    { q: 'Anunciar na Carbi tem custo?', a: 'A publicação é sem custo dentro do limite de até 5 anúncios ativos por conta e até 10 fotos por anúncio.' },
  ],
  bottomCtaTitle: 'Crie um anúncio claro para o seu carro',
  bottomCtaDescription: 'Informe os dados do veículo, adicione fotos atuais e converse com interessados pelo chat interno.',
  bottomCtaButtonText: 'Anunciar meu carro',
}

export default function VenderCarroRapidoPage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro/fluxo" />
}
