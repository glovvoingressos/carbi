export const SEO_DATA = {
  anunciar: {
    title: 'Anunciar carro na Carbi | Publique seu veículo',
    description: 'Crie seu anúncio de carro sem custo no plano gratuito, dentro do limite de até 5 anúncios ativos por conta e 10 fotos por anúncio.',
    h1: 'Anunciar carro na Carbi',
    subtitle: 'Preencha os dados do veículo, adicione fotos atuais e revise as informações antes de publicar.',
    benefits: [
      { icon: 'Car', title: 'Dados do veículo', description: 'Informe marca, modelo, versão, ano-modelo, quilometragem e estado.' },
      { icon: 'Check', title: 'Você revisa', description: 'Confira o anúncio e os dados antes de enviá-lo para publicação.' },
      { icon: 'MessageSquare', title: 'Chat interno', description: 'Converse com interessados pela plataforma sem publicar seu telefone no anúncio.' }
    ],
    sections: [
      {
        badge: 'Cadastro',
        title: 'Como preparar seu anúncio',
        subtitle: 'Use dados e imagens que correspondam ao carro anunciado.',
        content: `Consulte a placa se quiser preencher os dados disponíveis, confira versão e ano-modelo, informe quilometragem e condição e adicione fotos atuais. Revise cada campo antes de publicar. O anúncio padrão é sem custo dentro do limite do plano gratuito: até 5 anúncios ativos por conta e até 10 fotos por anúncio.`
      },
      {
        badge: 'Preço e negociação',
        title: 'Compare referências e negocie pelo chat',
        subtitle: 'Preço pedido e valor FIPE são informações diferentes.',
        content: `Você define o preço pedido. Quando a combinação exata de ano e versão estiver disponível, consulte a FIPE e observe o mês de referência; ela é uma referência, não uma garantia de venda. A visibilidade e o prazo dependem do veículo, das informações do anúncio e da procura.`
      }
    ],
    faqs: [
      { q: 'O que é gratuito e por quanto tempo?', a: 'A publicação padrão do plano gratuito não é apresentada como promoção com prazo definido. O limite é de até 5 anúncios ativos por conta e até 10 fotos por anúncio; recursos Pro podem ter cobrança própria.' },
      { q: 'Como posso deixar o anúncio mais útil?', a: 'Use fotos atuais, informe versão, quilometragem e condição e descreva itens ou reparos que possa confirmar. Isso ajuda a pessoa interessada a avaliar o veículo, mas não garante prazo de venda.' },
      { q: 'Meu telefone fica exposto no anúncio?', a: 'O telefone não aparece na página pública do anúncio. A conversa começa pelo chat interno; compartilhe outros dados apenas quando decidir.' }
    ]
  },
  vender: {
    title: 'Vender carro online | Prepare o anúncio na Carbi',
    description: 'Veja como informar dados, condição e preço pedido do carro ao criar um anúncio na Carbi. O prazo de venda depende do veículo e da negociação.',
    h1: 'Venda seu carro online',
    subtitle: 'Publique as informações do veículo e converse com interessados pelo chat interno. Não há prazo ou preço de venda garantido.',
    benefits: [
      { icon: 'BadgeDollarSign', title: 'Preço pedido claro', description: 'Diferencie o valor anunciado da referência FIPE, quando a combinação exata estiver disponível.' },
      { icon: 'Search', title: 'Informações completas', description: 'Informe versão, ano-modelo, quilometragem, estado e histórico que possa comprovar.' },
      { icon: 'MessageSquare', title: 'Chat interno', description: 'Receba mensagens pela plataforma sem publicar o telefone no anúncio.' }
    ],
    sections: [
      {
        badge: 'Preparação',
        title: 'O que incluir ao anunciar',
        subtitle: 'Descrições úteis separam fatos confirmados de estimativas.',
        content: `Informe versão, ano-modelo, quilometragem, condição e preço pedido. Acrescente fotos atuais e registros de revisão ou reparo quando estiverem disponíveis. Não declare garantia, estado mecânico ou histórico que não possa confirmar.`
      },
      {
        badge: 'Preço e visita',
        title: 'Compare o preço e planeje a visita',
        subtitle: 'A referência ajuda, mas não determina o valor final.',
        content: `Compare carros da mesma versão, ano e condição. Use FIPE apenas com correspondência exata e confira o mês de referência. Antes de entregar o carro, verifique pagamento e transferência; combine visitas com cuidado. O resultado e o prazo dependem da negociação entre as partes.`
      }
    ],
    faqs: [
      { q: 'Quanto tempo demora para vender?', a: 'Não há prazo garantido. O tempo depende do veículo, do preço pedido, da procura e das condições negociadas.' },
      { q: 'A FIPE é o preço de venda?', a: 'Não. É uma referência mensal. Confira a versão e o ano-modelo e compare o preço pedido separadamente.' },
      { q: 'O anúncio é gratuito?', a: 'A publicação padrão do plano gratuito é sem custo, limitada a até 5 anúncios ativos por conta e até 10 fotos por anúncio. Recursos Pro podem ter cobrança própria.' }
    ]
  },
  venderCaminhao: {
    title: 'Anunciar caminhão na Carbi | Publique seu veículo',
    description: 'Cadastre os dados do caminhão, incluindo configuração e capacidade, adicione fotos e converse com interessados pelo chat interno. Publicação padrão sem custo dentro do limite informado.',
    h1: 'Anunciar caminhão na Carbi',
    subtitle: 'Informe os dados do veículo e revise a ficha antes de enviar. A comparação FIPE aparece somente quando houver referência disponível.',
    benefits: [
      { icon: 'Zap', title: 'Comece pela placa', description: 'Quando houver dados disponíveis para a placa, confira marca, modelo, ano e versão e complete o restante da ficha.' },
      { icon: 'ShieldCheck', title: 'Ficha técnica de caminhão', description: 'Tipo, eixos, capacidade de carga, PBT, CMT, carroceria e cabine — os dados que o comprador procura antes de ligar.' },
      { icon: 'MessageSquare', title: 'Chat interno', description: 'Converse pela plataforma sem publicar seu telefone no anúncio.' },
    ],
    steps: [
      { title: 'Consulte a placa', description: 'Informe a placa para buscar os dados disponíveis e confira se marca, modelo, ano e versão estão corretos.' },
      { title: 'Complete a ficha', description: 'Adicione eixos, capacidade de carga, PBT, CMT, carroceria, cabine e as fotos reais do veículo.' },
      { title: 'Publique e negocie', description: 'Publique gratuitamente e responda compradores pelo chat. Quando houver referência FIPE disponível, compare seu preço com a tabela.' },
    ],
    faqs: [
      { q: 'O que é gratuito e por quanto tempo?', a: 'A publicação padrão faz parte do plano gratuito, sem prazo promocional definido na oferta atual. O limite é de até 5 anúncios ativos por conta e 10 fotos por anúncio; recursos Pro têm cobrança separada.' },
      { q: 'Quais dados de caminhão o anúncio pede?', a: 'Além de marca, modelo, ano e quilometragem, pedimos o tipo de caminhão (truck, toco, bitruck ou cavalo mecânico), número de eixos, capacidade de carga, PBT, CMT, carroceria e cabine.' },
      { q: 'A consulta pela placa funciona para caminhão?', a: 'Ela busca os dados disponíveis para a placa; confira e complete a ficha antes de publicar.' },
      { q: 'Meu telefone fica exposto no anúncio?', a: 'Não. A conversa acontece no chat interno, então você compartilha dados de contato apenas quando se sentir confortável.' },
      { q: 'Preciso criar conta antes de começar?', a: 'Não. Você preenche os dados do caminhão primeiro e cria a conta no último passo, na hora de publicar.' },
    ],
  }
}
