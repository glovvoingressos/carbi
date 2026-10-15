import type { Metadata } from 'next'
import SEOPageClient from '@/components/seo/SEOPageClient'

export const metadata: Metadata = {
  title: 'Vender carro em Belo Horizonte | Anuncie na Carbi',
  description: 'Prepare o anúncio do seu carro em Belo Horizonte com dados, fotos atuais e preço pedido. Consulte a FIPE quando houver correspondência exata.',
  keywords: ['vender carro bh', 'vender carro belo horizonte', 'anunciar carro bh'],
  alternates: { canonical: '/vender-carro-bh' },
  openGraph: {
    title: 'Vender carro em Belo Horizonte | Anuncie na Carbi',
    description: 'Publique os dados do veículo, informe Belo Horizonte como cidade e converse com interessados pelo chat interno.',
    url: '/vender-carro-bh',
    type: 'website',
  },
}

const data = {
  h1: 'Vender carro em Belo Horizonte',
  subtitle: 'Publique o veículo com a cidade correta, dados conferíveis e fotos atuais. O prazo e o preço de venda dependem do veículo e da negociação.',
  ctaButtonText: 'Anunciar meu carro',
  benefits: [
    { icon: 'MapPin', title: 'Localização informada', description: 'Escolha Belo Horizonte como cidade do anúncio para que as pessoas possam considerar a localização ao pesquisar.' },
    { icon: 'BadgeDollarSign', title: 'Preço com referência', description: 'Compare o preço pedido com anúncios semelhantes e consulte a FIPE somente quando houver correspondência de ano e versão.' },
    { icon: 'MessageCircle', title: 'Contato pelo chat', description: 'A conversa começa no chat interno; compartilhe outros dados apenas quando decidir.' },
  ],
  sections: [
    {
      badge: 'Preparação',
      title: 'Como preparar o anúncio em BH',
      subtitle: 'Informe o estado real do carro e use imagens atuais.',
      content: 'Preencha marca, modelo, versão, ano-modelo, quilometragem, estado e preço pedido. Registre revisões, reparos ou avarias conhecidos e inclua comprovantes quando disponíveis. Cada conta pode manter até 5 anúncios ativos e cada anúncio aceita até 10 fotos.',
    },
    {
      badge: 'Preço',
      title: 'Use referências sem confundir preço pedido e FIPE',
      subtitle: 'A referência ajuda na comparação; não determina o valor de venda.',
      content: 'Compare veículos de versão, ano e condição semelhantes. Se a FIPE tiver a combinação exata, indique o mês consultado. O preço do anúncio é definido pelo vendedor, e o valor final depende da negociação entre as partes.',
    },
    {
      badge: 'Negociação local',
      title: 'Combine visita e verificação com cuidado',
      subtitle: 'A Carbi oferece o espaço do anúncio e o chat para iniciar a conversa.',
      content: 'Confirme a identidade de quem vai ao encontro, escolha um local público e movimentado, acompanhe qualquer test-drive e verifique pagamento e transferência antes de entregar o veículo. A plataforma não participa nem garante o resultado da negociação.',
    },
  ],
  faqs: [
    { q: 'O anúncio de carro em BH tem custo?', a: 'A publicação é sem custo dentro do limite de até 5 anúncios ativos por conta. Cada anúncio aceita até 10 fotos.' },
    { q: 'O anúncio será mostrado somente em Belo Horizonte?', a: 'Não há promessa de exibição exclusiva ou prioridade local. Informe a cidade corretamente para que ela apareça nos dados usados pelos filtros de localização.' },
    { q: 'A FIPE define o preço do meu carro?', a: 'Não. A FIPE é uma referência e só deve ser comparada quando ano e versão coincidirem. O preço pedido e o valor final são definidos pelo vendedor e pela negociação.' },
  ],
  bottomCtaTitle: 'Prepare seu anúncio de carro em BH',
  bottomCtaDescription: 'Revise os dados, adicione fotos atuais e converse com interessados pelo chat interno.',
  bottomCtaButtonText: 'Criar anúncio',
}

export default function VenderCarroBHPage() {
  return <SEOPageClient data={data} ctaHref="/anunciar-carro-bh/fluxo" />
}
