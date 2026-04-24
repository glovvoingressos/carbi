import { Zap, ShieldCheck, Heart, Search, MessageSquare, BadgeDollarSign } from 'lucide-react'

export const SEO_DATA = {
  anunciar: {
    title: 'Anunciar Carro: Venda seu veículo rápido e pelo melhor preço',
    description: 'Anuncie seu carro seminovo ou usado na Carbi. Alcance milhares de compradores interessados. Cadastro rápido, 100% seguro e sem burocracia.',
    h1: 'Anunciar Carro Grátis em Minutos',
    subtitle: 'A plataforma inteligente para quem quer vender sem atrito e com máxima segurança.',
    benefits: [
      { icon: 'Zap', title: 'Anúncio Rápido', description: 'Publique seu carro em menos de 2 minutos com nosso fluxo guiado por inteligência.' },
      { icon: 'ShieldCheck', title: 'Segurança Total', description: 'Chat interno criptografado para você negociar sem expor seu telefone ou e-mail.' },
      { icon: 'Heart', title: 'Atrito Zero', description: 'Design focado na experiência do usuário para facilitar a jornada de quem compra e quem vende.' }
    ],
    sections: [
      {
        badge: 'Venda Inteligente',
        title: 'Como anunciar seu carro na Carbi',
        subtitle: 'O processo foi desenhado para ser o mais simples possível.',
        content: `Para anunciar um carro conosco, você só precisa seguir três passos básicos. Primeiro, identifique seu veículo (marca, modelo e ano). Depois, adicione fotos de alta qualidade e uma descrição honesta. Por fim, defina o preço usando nossa referência da Tabela FIPE para garantir uma venda justa.`
      },
      {
        badge: 'Diferencial',
        title: 'Por que escolher a Carbi para anunciar?',
        subtitle: 'Diferente dos marketplaces tradicionais, focamos na qualidade do anúncio.',
        content: `Nossa tecnologia de SEO dinâmico garante que seu anúncio seja encontrado por quem realmente está buscando. Além disso, oferecemos ferramentas de comparação de preço que ajudam a posicionar seu veículo de forma competitiva no mercado.`
      }
    ],
    faqs: [
      { q: 'É realmente grátis anunciar meu carro?', a: 'Sim! Na Carbi você pode anunciar seu veículo sem custo inicial, com direito a até 10 fotos e todas as funcionalidades de chat.' },
      { q: 'Como faço para vender meu carro mais rápido?', a: 'Anúncios com fotos nítidas, descrição detalhada dos opcionais e preço próximo à tabela FIPE tendem a converter 3x mais rápido.' },
      { q: 'Meu telefone fica exposto no anúncio?', a: 'Não. Utilizamos um sistema de chat interno seguro para que você só compartilhe dados pessoais quando se sentir confortável com o comprador.' }
    ]
  },
  vender: {
    title: 'Vender Carro Online: A melhor forma de negociar seu veículo',
    description: 'Quer vender seu carro rápido? A Carbi é o marketplace de seminovos que mais cresce no Brasil. Venda seu veículo com segurança, rapidez e valorização real.',
    h1: 'Venda seu Carro hoje com Segurança',
    subtitle: 'Conectamos você aos melhores compradores de todo o Brasil.',
    benefits: [
      { icon: 'BadgeDollarSign', title: 'Melhor Avaliação', description: 'Compare seu preço com a FIPE em tempo real e não perca dinheiro na negociação.' },
      { icon: 'Search', title: 'Visibilidade Nacional', description: 'Seu anúncio é otimizado para ser encontrado por quem realmente quer comprar.' },
      { icon: 'MessageSquare', title: 'Negociação Direta', description: 'Fale direto com o comprador pelo nosso chat seguro, sem intermediários que diminuem seu lucro.' }
    ],
    sections: [
      {
        badge: 'Venda Direta',
        title: 'O marketplace de carros que mais cresce',
        subtitle: 'A Carbi redefine a experiência de compra e venda entre particulares.',
        content: `Vender seu carro online exige confiança. Com a Carbi, seu anúncio ganha visibilidade estruturada e proteção de dados, garantindo que as pessoas certas vejam seu veículo no momento da decisão.`
      },
      {
        badge: 'Praticidade',
        title: 'Dicas para vender seu carro rápido',
        subtitle: 'Tempo é dinheiro, especialmente no mercado automotivo.',
        content: `Para uma venda rápida, certifique-se de que a documentação está em dia e o IPVA pago. Mencione esses diferenciais no seu anúncio na Carbi para atrair compradores que buscam prontidão e segurança.`
      }
    ],
    faqs: [
      { q: 'Onde anunciar meu carro para vender rápido?', a: 'A Carbi é a melhor opção para anunciar online, pois possui foco em qualidade e ferramentas específicas para valorizar seu veículo.' },
      { q: 'Qual a vantagem de vender online?', a: 'A economia de tempo é gigante. Você não precisa levar o carro em agências; o comprador interessado vem até você após filtrar pela nossa plataforma.' },
      { q: 'Como saber o valor real do meu carro?', a: 'Utilizamos a base da Tabela FIPE atualizada mensalmente para te dar um norte preciso sobre o valor de mercado do seu veículo.' }
    ]
  }
}
