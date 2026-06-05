import { ListingsPageInput, ListingSort } from '@/lib/marketplace-server'

export type MarketplaceSeoPreset = {
  slug: string
  title: string
  description: string
  h1: string
  intro: string
  listingQuery: ListingsPageInput
}

export const PRICE_RANGE_PRESETS: MarketplaceSeoPreset[] = [
  {
    slug: 'ate-20-mil',
    title: 'Carros até R$ 20 mil | Carbi',
    description: 'Anúncios de carros até R$ 20 mil com preços atualizados e dados reais. Encontre seminovos baratos.',
    h1: 'Carros até R$ 20 mil',
    intro: 'Explore anúncios ativos com teto de R$ 20 mil para comparar oportunidades reais.',
    listingQuery: { priceMax: 20000, sort: 'price_asc' },
  },
  {
    slug: 'ate-30-mil',
    title: 'Carros até R$ 30 mil | Carbi',
    description: 'Veja opções de carros até R$ 30 mil em anúncios atualizados diariamente. Seminovos com melhor custo-benefício.',
    h1: 'Carros até R$ 30 mil',
    intro: 'Seleção atualizada com anúncios reais para quem busca carros nessa faixa de preço.',
    listingQuery: { priceMax: 30000, sort: 'price_asc' },
  },
  {
    slug: 'ate-40-mil',
    title: 'Carros até R$ 40 mil | Carbi',
    description: 'Encontre carros até R$ 40 mil anunciados na Carbi com transparência e comparação FIPE.',
    h1: 'Carros até R$ 40 mil',
    intro: 'Navegue por anúncios de carros até R$ 40 mil com dados atualizados.',
    listingQuery: { priceMax: 40000, sort: 'price_asc' },
  },
  {
    slug: 'ate-50-mil',
    title: 'Carros até R$ 50 mil | Carbi',
    description: 'Anúncios de carros até R$ 50 mil com preços atualizados e dados reais.',
    h1: 'Carros até R$ 50 mil',
    intro: 'Explore anúncios ativos com teto de R$ 50 mil para comparar oportunidades reais.',
    listingQuery: { priceMax: 50000, sort: 'price_asc' },
  },
  {
    slug: 'ate-60-mil',
    title: 'Carros até R$ 60 mil | Carbi',
    description: 'Carros anunciados até R$ 60 mil na Carbi. Compare preços, km e ano dos seminovos.',
    h1: 'Carros até R$ 60 mil',
    intro: 'Descubra anúncios ativos com valor até R$ 60 mil e encontre o carro ideal.',
    listingQuery: { priceMax: 60000, sort: 'price_asc' },
  },
  {
    slug: 'ate-80-mil',
    title: 'Carros até R$ 80 mil | Carbi',
    description: 'Veja opções de carros até R$ 80 mil em anúncios atualizados diariamente.',
    h1: 'Carros até R$ 80 mil',
    intro: 'Seleção atualizada com anúncios reais para quem está pesquisando carros nessa faixa de preço.',
    listingQuery: { priceMax: 80000, sort: 'price_asc' },
  },
  {
    slug: 'ate-100-mil',
    title: 'Carros até R$ 100 mil | Carbi',
    description: 'Anúncios de carros até R$ 100 mil na Carbi. SUVs, sedans e hatches seminovos.',
    h1: 'Carros até R$ 100 mil',
    intro: 'Explore carros seminovos até R$ 100 mil com dados de FIPE e fotos reais.',
    listingQuery: { priceMax: 100000, sort: 'price_asc' },
  },
  {
    slug: 'ate-150-mil',
    title: 'Carros até R$ 150 mil | Carbi',
    description: 'Carros seminovos até R$ 150 mil anunciados na Carbi. Modelos premium e completos.',
    h1: 'Carros até R$ 150 mil',
    intro: 'Navegue pelos melhores seminovos até R$ 150 mil na plataforma.',
    listingQuery: { priceMax: 150000, sort: 'price_asc' },
  },
  {
    slug: 'de-50-a-80-mil',
    title: 'Carros de R$ 50 a R$ 80 mil | Carbi',
    description: 'Carros na faixa de R$ 50 mil a R$ 80 mil anunciados na Carbi com preços reais.',
    h1: 'Carros de R$ 50 mil a R$ 80 mil',
    intro: 'Descubra seminovos na faixa entre R$ 50 mil e R$ 80 mil.',
    listingQuery: { priceMin: 50000, priceMax: 80000, sort: 'price_asc' },
  },
  {
    slug: 'de-80-a-120-mil',
    title: 'Carros de R$ 80 a R$ 120 mil | Carbi',
    description: 'Carros seminovos entre R$ 80 mil e R$ 120 mil. Encontre seu próximo veículo.',
    h1: 'Carros de R$ 80 mil a R$ 120 mil',
    intro: 'Os melhores seminovos na faixa de R$ 80 mil a R$ 120 mil.',
    listingQuery: { priceMin: 80000, priceMax: 120000, sort: 'price_asc' },
  },
  {
    slug: 'acima-de-100-mil',
    title: 'Carros acima de R$ 100 mil | Carbi',
    description: 'Carros seminovos acima de R$ 100 mil. Modelos premium, SUVs de luxo e mais.',
    h1: 'Carros acima de R$ 100 mil',
    intro: 'Veja os seminovos mais premium anunciados na Carbi.',
    listingQuery: { priceMin: 100000, sort: 'price_asc' },
  },
]

export const BODY_TYPE_PRESETS: MarketplaceSeoPreset[] = [
  {
    slug: 'suv',
    title: 'SUVs à venda | Carbi',
    description: 'Anúncios de SUVs com preços, quilometragem e ano/modelo atualizados.',
    h1: 'SUVs à venda',
    intro: 'Descubra SUVs publicados na plataforma e acompanhe oportunidades por preço e ano.',
    listingQuery: { bodyType: 'suv', sort: 'recent' },
  },
  {
    slug: 'sedan',
    title: 'Sedans à venda | Carbi',
    description: 'Sedans seminovos anunciados na Carbi. Compare preços e versões.',
    h1: 'Sedans à venda',
    intro: 'Os melhores sedans seminovos anunciados na plataforma.',
    listingQuery: { bodyType: 'sedan', sort: 'recent' },
  },
  {
    slug: 'hatch',
    title: 'Hatchers à venda | Carbi',
    description: 'Carros hatch seminovos anunciados na Carbi. Compactos e econômicos.',
    h1: 'Hatchers à venda',
    intro: 'Descubra hatchers seminovos com o melhor custo-benefício.',
    listingQuery: { bodyType: 'hatch', sort: 'recent' },
  },
  {
    slug: 'picape',
    title: 'Picapes à venda | Carbi',
    description: 'Picapes seminovas anunciadas na Carbi. Compare preços e versões.',
    h1: 'Picapes à venda',
    intro: 'Encontre picapes seminovas anunciadas na plataforma.',
    listingQuery: { bodyType: 'pickup', sort: 'recent' },
  },
  {
    slug: 'eletricos',
    title: 'Carros elétricos à venda | Carbi',
    description: 'Carros elétricos seminovos anunciados na Carbi. Sustentabilidade e economia.',
    h1: 'Carros elétricos à venda',
    intro: 'Explore carros elétricos seminovos na plataforma.',
    listingQuery: { fuel: 'electric', sort: 'recent' },
  },
  {
    slug: 'hibridos',
    title: 'Carros híbridos à venda | Carbi',
    description: 'Carros híbridos seminovos anunciados na Carbi. Economia e tecnologia.',
    h1: 'Carros híbridos à venda',
    intro: 'Descubra carros híbridos seminovos anunciados na plataforma.',
    listingQuery: { fuel: 'hybrid', sort: 'recent' },
  },
]

export const TRANSMISSION_PRESETS: MarketplaceSeoPreset[] = [
  {
    slug: 'automaticos',
    title: 'Carros automáticos à venda | Carbi',
    description: 'Carros automáticos em anúncios reais com filtros de preço, km e ano.',
    h1: 'Carros automáticos à venda',
    intro: 'Lista de anúncios ativos para quem prefere câmbio automático.',
    listingQuery: { transmission: 'autom', sort: 'recent' },
  },
  {
    slug: 'manuais',
    title: 'Carros manuais à venda | Carbi',
    description: 'Carros com câmbio manual anunciados na Carbi. Mais econômicos e tradicionais.',
    h1: 'Carros manuais à venda',
    intro: 'Encontre carros com câmbio manual anunciados na plataforma.',
    listingQuery: { transmission: 'manual', sort: 'recent' },
  },
]

export const FUEL_TYPE_PRESETS: MarketplaceSeoPreset[] = [
  {
    slug: 'flex',
    title: 'Carros flex à venda | Carbi',
    description: 'Carros flex (álcool e gasolina) seminovos anunciados na Carbi.',
    h1: 'Carros flex à venda',
    intro: 'Veja carros flex seminovos anunciados na plataforma.',
    listingQuery: { fuel: 'flex', sort: 'recent' },
  },
  {
    slug: 'gasolina',
    title: 'Carros a gasolina à venda | Carbi',
    description: 'Carros a gasolina seminovos anunciados na Carbi com preços atualizados.',
    h1: 'Carros a gasolina à venda',
    intro: 'Encontre carros a gasolina seminovos anunciados na plataforma.',
    listingQuery: { fuel: 'gasoline', sort: 'recent' },
  },
  {
    slug: 'diesel',
    title: 'Carros a diesel à venda | Carbi',
    description: 'Carros a diesel seminovos anunciados na Carbi. Picapes e veículos pesados.',
    h1: 'Carros a diesel à venda',
    intro: 'Explore carros a diesel seminovos anunciados na plataforma.',
    listingQuery: { fuel: 'diesel', sort: 'recent' },
  },
]

export const COMBINED_PRESETS: MarketplaceSeoPreset[] = [
  {
    slug: 'suv-ate-80-mil',
    title: 'SUVs até R$ 80 mil | Carbi',
    description: 'SUVs anunciados até R$ 80 mil com dados reais de preço e quilometragem.',
    h1: 'SUVs até R$ 80 mil',
    intro: 'Navegue por anúncios de SUVs nessa faixa de preço com ordenação inteligente.',
    listingQuery: { bodyType: 'suv', priceMax: 80000, sort: 'price_asc' },
  },
  {
    slug: 'suv-ate-100-mil',
    title: 'SUVs até R$ 100 mil | Carbi',
    description: 'SUVs seminovos até R$ 100 mil anunciados na Carbi. Compare preços e versões.',
    h1: 'SUVs até R$ 100 mil',
    intro: 'Os melhores SUVs seminovos até R$ 100 mil na plataforma.',
    listingQuery: { bodyType: 'suv', priceMax: 100000, sort: 'price_asc' },
  },
  {
    slug: 'suv-ate-50-mil',
    title: 'SUVs até R$ 50 mil | Carbi',
    description: 'SUVs seminovos até R$ 50 mil anunciados na Carbi. Os mais baratos do mercado.',
    h1: 'SUVs até R$ 50 mil',
    intro: 'SUVs seminovos com ótimo custo-benefício até R$ 50 mil.',
    listingQuery: { bodyType: 'suv', priceMax: 50000, sort: 'price_asc' },
  },
  {
    slug: 'sedan-ate-50-mil',
    title: 'Sedans até R$ 50 mil | Carbi',
    description: 'Sedans seminovos até R$ 50 mil anunciados na Carbi. Conforto por pouco.',
    h1: 'Sedans até R$ 50 mil',
    intro: 'Os melhores sedans seminovos até R$ 50 mil na plataforma.',
    listingQuery: { bodyType: 'sedan', priceMax: 50000, sort: 'price_asc' },
  },
  {
    slug: 'sedan-ate-80-mil',
    title: 'Sedans até R$ 80 mil | Carbi',
    description: 'Sedans seminovos até R$ 80 mil anunciados na Carbi.',
    h1: 'Sedans até R$ 80 mil',
    intro: 'Sedans seminovos de qualidade até R$ 80 mil.',
    listingQuery: { bodyType: 'sedan', priceMax: 80000, sort: 'price_asc' },
  },
  {
    slug: 'hatch-ate-50-mil',
    title: 'Hatchers até R$ 50 mil | Carbi',
    description: 'Hatchers seminovos até R$ 50 mil anunciados na Carbi.',
    h1: 'Hatchers até R$ 50 mil',
    intro: 'Hatchers seminovos econômicos até R$ 50 mil.',
    listingQuery: { bodyType: 'hatch', priceMax: 50000, sort: 'price_asc' },
  },
  {
    slug: 'picape-ate-80-mil',
    title: 'Picapes até R$ 80 mil | Carbi',
    description: 'Picapes seminovas até R$ 80 mil anunciadas na Carbi.',
    h1: 'Picapes até R$ 80 mil',
    intro: 'Picapes seminovas com ótimo custo-benefício até R$ 80 mil.',
    listingQuery: { bodyType: 'pickup', priceMax: 80000, sort: 'price_asc' },
  },
  {
    slug: 'picape-ate-120-mil',
    title: 'Picapes até R$ 120 mil | Carbi',
    description: 'Picapes seminovas até R$ 120 mil anunciadas na Carbi.',
    h1: 'Picapes até R$ 120 mil',
    intro: 'Picapes seminovas robustas até R$ 120 mil.',
    listingQuery: { bodyType: 'pickup', priceMax: 120000, sort: 'price_asc' },
  },
  {
    slug: 'automaticos-ate-50-mil',
    title: 'Carros automáticos até R$ 50 mil | Carbi',
    description: 'Carros automáticos seminovos até R$ 50 mil anunciados na Carbi.',
    h1: 'Carros automáticos até R$ 50 mil',
    intro: 'Carros com câmbio automático seminovos até R$ 50 mil.',
    listingQuery: { transmission: 'autom', priceMax: 50000, sort: 'price_asc' },
  },
  {
    slug: 'automaticos-ate-80-mil',
    title: 'Carros automáticos até R$ 80 mil | Carbi',
    description: 'Carros automáticos seminovos até R$ 80 mil anunciados na Carbi.',
    h1: 'Carros automáticos até R$ 80 mil',
    intro: 'Carros automáticos seminovos de qualidade até R$ 80 mil.',
    listingQuery: { transmission: 'autom', priceMax: 80000, sort: 'price_asc' },
  },
  {
    slug: 'suv-automatico',
    title: 'SUVs automáticos à venda | Carbi',
    description: 'SUVs com câmbio automático seminovos anunciados na Carbi.',
    h1: 'SUVs automáticos à venda',
    intro: 'SUVs com câmbio automático seminovos na plataforma.',
    listingQuery: { bodyType: 'suv', transmission: 'autom', sort: 'recent' },
  },
  {
    slug: 'sedan-automatico',
    title: 'Sedans automáticos à venda | Carbi',
    description: 'Sedans com câmbio automático seminovos anunciados na Carbi.',
    h1: 'Sedans automáticos à venda',
    intro: 'Sedans com câmbio automático seminovos na plataforma.',
    listingQuery: { bodyType: 'sedan', transmission: 'autom', sort: 'recent' },
  },
  {
    slug: 'seminovos-ate-50-mil',
    title: 'Seminovos até R$ 50 mil | Carbi',
    description: 'Seminovos até R$ 50 mil anunciados na Carbi com fotos reais e FIPE.',
    h1: 'Seminovos até R$ 50 mil',
    intro: 'Os melhores seminovos até R$ 50 mil anunciados na plataforma.',
    listingQuery: { priceMax: 50000, sort: 'recent' },
  },
  {
    slug: 'seminovos-ate-80-mil',
    title: 'Seminovos até R$ 80 mil | Carbi',
    description: 'Seminovos até R$ 80 mil anunciados na Carbi. Encontre seu próximo carro.',
    h1: 'Seminovos até R$ 80 mil',
    intro: 'Seminovos de qualidade até R$ 80 mil anunciados na plataforma.',
    listingQuery: { priceMax: 80000, sort: 'recent' },
  },
]

export const TOPIC_PRESETS: MarketplaceSeoPreset[] = [
  {
    slug: 'anunciar-gratis',
    title: 'Anunciar carro grátis | Carbi',
    description: 'Publique seu carro grátis na Carbi com fotos reais, chat interno e comparação FIPE.',
    h1: 'Anunciar carro grátis',
    intro: 'Fluxo rápido para publicar seu veículo sem custo e alcançar compradores reais.',
    listingQuery: { sort: 'recent' },
  },
  {
    slug: 'seminovos-a-venda',
    title: 'Seminovos à venda | Carbi',
    description: 'Veja seminovos à venda com preço, fotos quadradas e comparação FIPE atualizada.',
    h1: 'Seminovos à venda',
    intro: 'Descubra seminovos reais em destaque, com filtros e ordenação por intenção de compra.',
    listingQuery: { sort: 'recent' },
  },
  {
    slug: 'carros-usados',
    title: 'Carros usados à venda | Carbi',
    description: 'Encontre carros usados à venda com transparência, preço real e anúncios ativos.',
    h1: 'Carros usados à venda',
    intro: 'Seleção de carros usados para quem busca compra direta com mais confiança.',
    listingQuery: { sort: 'recent' },
  },
  {
    slug: 'mais-baratos',
    title: 'Carros mais baratos à venda | Carbi',
    description: 'Veja os anúncios com menor preço na plataforma em ordem crescente.',
    h1: 'Carros mais baratos',
    intro: 'Ordenação por menor preço para facilitar a descoberta das melhores opções.',
    listingQuery: { sort: 'price_asc' },
  },
  {
    slug: 'mais-recentes',
    title: 'Carros recém-anunciados | Carbi',
    description: 'Acompanhe os anúncios mais recentes de carros com atualização em tempo real.',
    h1: 'Carros recém-anunciados',
    intro: 'Atualização frequente de anúncios para quem gosta de acompanhar novidades.',
    listingQuery: { sort: 'recent' },
  },
]

export const MARKETPLACE_SEO_PRESETS: MarketplaceSeoPreset[] = [
  ...TOPIC_PRESETS,
  ...PRICE_RANGE_PRESETS,
  ...BODY_TYPE_PRESETS,
  ...TRANSMISSION_PRESETS,
  ...FUEL_TYPE_PRESETS,
  ...COMBINED_PRESETS,
]

export const MARKETPLACE_SEO_SLUGS = MARKETPLACE_SEO_PRESETS.map((preset) => preset.slug)

export type CityEntry = {
  name: string
  slug: string
  state: string
}

export const MAJOR_CITIES: CityEntry[] = [
  { name: 'São Paulo', slug: 'sao-paulo', state: 'SP' },
  { name: 'Rio de Janeiro', slug: 'rio-de-janeiro', state: 'RJ' },
  { name: 'Belo Horizonte', slug: 'belo-horizonte', state: 'MG' },
  { name: 'Brasília', slug: 'brasilia', state: 'DF' },
  { name: 'Curitiba', slug: 'curitiba', state: 'PR' },
  { name: 'Porto Alegre', slug: 'porto-alegre', state: 'RS' },
  { name: 'Salvador', slug: 'salvador', state: 'BA' },
  { name: 'Fortaleza', slug: 'fortaleza', state: 'CE' },
  { name: 'Recife', slug: 'recife', state: 'PE' },
  { name: 'Goiânia', slug: 'goiania', state: 'GO' },
  { name: 'Campinas', slug: 'campinas', state: 'SP' },
  { name: 'Guarulhos', slug: 'guarulhos', state: 'SP' },
  { name: 'São Bernardo do Campo', slug: 'sao-bernardo-do-campo', state: 'SP' },
  { name: 'Santo André', slug: 'santo-andre', state: 'SP' },
  { name: 'Osasco', slug: 'osasco', state: 'SP' },
  { name: 'Ribeirão Preto', slug: 'ribeirao-preto', state: 'SP' },
  { name: 'Uberlândia', slug: 'uberlandia', state: 'MG' },
  { name: 'Sorocaba', slug: 'sorocaba', state: 'SP' },
  { name: 'Contagem', slug: 'contagem', state: 'MG' },
  { name: 'Juiz de Fora', slug: 'juiz-de-fora', state: 'MG' },
  { name: 'São José dos Campos', slug: 'sao-jose-dos-campos', state: 'SP' },
  { name: 'Santos', slug: 'santos', state: 'SP' },
  { name: 'Niterói', slug: 'niteroi', state: 'RJ' },
  { name: 'Duque de Caxias', slug: 'duque-de-caxias', state: 'RJ' },
  { name: 'Nova Iguaçu', slug: 'nova-iguacu', state: 'RJ' },
  { name: 'São Gonçalo', slug: 'sao-goncalo', state: 'RJ' },
  { name: 'Campos dos Goytacazes', slug: 'campos-dos-goytacazes', state: 'RJ' },
  { name: 'Maringá', slug: 'maringa', state: 'PR' },
  { name: 'Londrina', slug: 'londrina', state: 'PR' },
  { name: 'Joinville', slug: 'joinville', state: 'SC' },
  { name: 'Florianópolis', slug: 'florianopolis', state: 'SC' },
  { name: 'Blumenau', slug: 'blumenau', state: 'SC' },
  { name: 'Caxias do Sul', slug: 'caxias-do-sul', state: 'RS' },
  { name: 'Pelotas', slug: 'pelotas', state: 'RS' },
  { name: 'Canoas', slug: 'canoas', state: 'RS' },
  { name: 'Vitória', slug: 'vitoria', state: 'ES' },
  { name: 'Vila Velha', slug: 'vila-velha', state: 'ES' },
  { name: 'Manaus', slug: 'manaus', state: 'AM' },
  { name: 'Belém', slug: 'belem', state: 'PA' },
  { name: 'São Luís', slug: 'sao-luis', state: 'MA' },
  { name: 'Teresina', slug: 'teresina', state: 'PI' },
  { name: 'Natal', slug: 'natal', state: 'RN' },
  { name: 'João Pessoa', slug: 'joao-pessoa', state: 'PB' },
  { name: 'Maceió', slug: 'maceio', state: 'AL' },
  { name: 'Aracaju', slug: 'aracaju', state: 'SE' },
  { name: 'Cuiabá', slug: 'cuiaba', state: 'MT' },
  { name: 'Campo Grande', slug: 'campo-grande', state: 'MS' },
  { name: 'São José do Rio Preto', slug: 'sao-jose-do-rio-preto', state: 'SP' },
  { name: 'Taubaté', slug: 'taubate', state: 'SP' },
  { name: 'Piracicaba', slug: 'piracicaba', state: 'SP' },
  { name: 'Jundiaí', slug: 'jundiai', state: 'SP' },
  { name: 'Bauru', slug: 'bauru', state: 'SP' },
  { name: 'São Carlos', slug: 'sao-carlos', state: 'SP' },
  { name: 'Presidente Prudente', slug: 'presidente-prudente', state: 'SP' },
  { name: 'Franca', slug: 'franca', state: 'SP' },
  { name: 'Araraquara', slug: 'araraquara', state: 'SP' },
  { name: 'Feira de Santana', slug: 'feira-de-santana', state: 'BA' },
  { name: 'Petrópolis', slug: 'petropolis', state: 'RJ' },
  { name: 'Volta Redonda', slug: 'volta-redonda', state: 'RJ' },
  { name: 'Uberaba', slug: 'uberaba', state: 'MG' },
  { name: 'Betim', slug: 'betim', state: 'MG' },
  { name: 'Montes Claros', slug: 'montes-claros', state: 'MG' },
  { name: 'Divinópolis', slug: 'divinopolis', state: 'MG' },
  { name: 'Governador Valadares', slug: 'governador-valadares', state: 'MG' },
  { name: 'Ipatinga', slug: 'ipatinga', state: 'MG' },
  { name: 'Ponta Grossa', slug: 'ponta-grossa', state: 'PR' },
  { name: 'Cascavel', slug: 'cascavel', state: 'PR' },
  { name: 'Foz do Iguaçu', slug: 'foz-do-iguacu', state: 'PR' },
  { name: 'São José', slug: 'sao-jose', state: 'SC' },
  { name: 'Santa Maria', slug: 'santa-maria', state: 'RS' },
  { name: 'Passo Fundo', slug: 'passo-fundo', state: 'RS' },
  { name: 'Novo Hamburgo', slug: 'novo-hamburgo', state: 'RS' },
]

function decodeSlug(slug: string): string {
  return decodeURIComponent(slug || '').trim().toLowerCase()
}

export function resolveSeoPreset(slug: string): MarketplaceSeoPreset | null {
  const normalized = decodeSlug(slug)
  const direct = MARKETPLACE_SEO_PRESETS.find((preset) => preset.slug === normalized)
  if (direct) return direct

  if (normalized.startsWith('marca-')) {
    const brandName = normalized.replace('marca-', '').replace(/-/g, ' ')
    const titleBrand = brandName.replace(/\b\w/g, (match) => match.toUpperCase())
    return {
      slug: normalized,
      title: `Carros ${titleBrand} à venda | Carbi`,
      description: `Explore anúncios ativos da marca ${titleBrand} com preços e quilometragem atualizados.`,
      h1: `Carros ${titleBrand} à venda`,
      intro: `Anúncios reais da marca ${titleBrand} para quem quer acompanhar preços e oportunidades.`,
      listingQuery: { brand: `%${titleBrand}%`, sort: 'recent' },
    }
  }

  if (normalized.startsWith('cidade-')) {
    const cityName = normalized.replace('cidade-', '').replace(/-/g, ' ')
    const titleCity = cityName.replace(/\b\w/g, (match) => match.toUpperCase())
    return {
      slug: normalized,
      title: `Carros em ${titleCity} | Carbi`,
      description: `Veja anúncios de carros em ${titleCity} com atualização constante de preço e disponibilidade.`,
      h1: `Carros em ${titleCity}`,
      intro: `Explore os anúncios ativos na cidade de ${titleCity} com foco em descoberta e comparação.`,
      listingQuery: { city: `%${titleCity}%`, sort: 'recent' },
    }
  }

  if (normalized.startsWith('ano-')) {
    const year = normalized.replace('ano-', '')
    if (/^\d{4}$/.test(year)) {
      return {
        slug: normalized,
        title: `Carros ${year} à venda | Carbi`,
        description: `Carros do ano ${year} seminovos anunciados na Carbi. Compare preços e versões.`,
        h1: `Carros ${year} à venda`,
        intro: `Anúncios de carros do ano ${year} publicados na plataforma.`,
        listingQuery: { yearMax: parseInt(year), yearMin: parseInt(year), sort: 'recent' },
      }
    }
  }

  return null
}

export const CITY_SLUGS = MAJOR_CITIES.map((city) => `cidade-${city.slug}`)

export function getAllSeoSlugs(): string[] {
  const staticSlugs = MARKETPLACE_SEO_PRESETS.map((p) => p.slug)
  return staticSlugs
}

export const ALL_SITEMAP_SLUGS = getAllSeoSlugs()

export const QUICK_LINKS: Array<{ href: string; label: string }> = [
  { href: '/carros/ate-20-mil', label: 'Até R$ 20 mil' },
  { href: '/carros/ate-30-mil', label: 'Até R$ 30 mil' },
  { href: '/carros/ate-40-mil', label: 'Até R$ 40 mil' },
  { href: '/carros/ate-50-mil', label: 'Até R$ 50 mil' },
  { href: '/carros/ate-60-mil', label: 'Até R$ 60 mil' },
  { href: '/carros/ate-80-mil', label: 'Até R$ 80 mil' },
  { href: '/carros/ate-100-mil', label: 'Até R$ 100 mil' },
  { href: '/carros/suv', label: 'SUVs' },
  { href: '/carros/sedan', label: 'Sedans' },
  { href: '/carros/picape', label: 'Picapes' },
  { href: '/carros/automaticos', label: 'Automáticos' },
  { href: '/carros/eletricos', label: 'Elétricos' },
  { href: '/carros/mais-baratos', label: 'Mais baratos' },
  { href: '/carros/mais-recentes', label: 'Mais recentes' },
]

export const ALLOWED_SORTS: ListingSort[] = ['recent', 'price_asc', 'price_desc', 'mileage_asc', 'year_desc']
