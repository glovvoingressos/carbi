export interface RankingModelItem {
  position: number
  previousPosition?: number
  brand: string
  model: string
  versionName?: string
  slug: string
  unitsSold: number
  marketSharePercentage: number
  category: string
  segment: 'hatch' | 'sedan' | 'suv' | 'pickup' | 'electric' | 'sport'
  startingPriceBrl: number
  fipeAvgPriceBrl?: number
  image?: string
  highlights?: string[]
}

export interface PeriodRankingData {
  period: string // e.g. 'julho-2026'
  periodLabel: string // e.g. 'Julho / 2026'
  marketType: 'new' | 'used'
  totalMarketUnits: number
  lastUpdated: string
  rankings: RankingModelItem[]
}

export interface StateRankingData {
  stateSlug: string // e.g. 'sao-paulo'
  stateName: string // e.g. 'São Paulo'
  uf: string // e.g. 'SP'
  totalUnitsSold: number
  rankings: RankingModelItem[]
}

// 100 Mais Vendidos - Julho 2026 (0 km / Novos)
export const JULY_2026_NEW_RANKINGS: RankingModelItem[] = [
  {
    position: 1,
    previousPosition: 1,
    brand: 'Volkswagen',
    model: 'Polo',
    slug: 'volkswagen-polo',
    unitsSold: 12450,
    marketSharePercentage: 6.8,
    category: 'Hatch Compacto',
    segment: 'hatch',
    startingPriceBrl: 90990,
    fipeAvgPriceBrl: 92500,
    image: '/images/cars/vw-polo.jpg',
    highlights: ['Líder isolado de vendas no Brasil', 'Motor TSI eficiente', 'Excelente valor de revenda']
  },
  {
    position: 2,
    previousPosition: 3,
    brand: 'Fiat',
    model: 'Strada',
    slug: 'fiat-strada',
    unitsSold: 11890,
    marketSharePercentage: 6.5,
    category: 'Picape Compacta',
    segment: 'pickup',
    startingPriceBrl: 104990,
    fipeAvgPriceBrl: 106000,
    image: '/images/cars/fiat-strada.jpg',
    highlights: ['Picape mais vendida', 'Versatilidade de trabalho e lazer', 'Motor Turbo 200 disponível']
  },
  {
    position: 3,
    previousPosition: 2,
    brand: 'Hyundai',
    model: 'HB20',
    slug: 'hyundai-hb20',
    unitsSold: 9750,
    marketSharePercentage: 5.3,
    category: 'Hatch Compacto',
    segment: 'hatch',
    startingPriceBrl: 88990,
    fipeAvgPriceBrl: 90000,
    image: '/images/cars/hyundai-hb20.jpg',
    highlights: ['Garantia de 5 anos', 'Design moderno', 'Pacote Bluelink conectado']
  },
  {
    position: 4,
    previousPosition: 4,
    brand: 'Chevrolet',
    model: 'Onix',
    slug: 'chevrolet-onix',
    unitsSold: 9120,
    marketSharePercentage: 5.0,
    category: 'Hatch Compacto',
    segment: 'hatch',
    startingPriceBrl: 89990,
    fipeAvgPriceBrl: 91200,
    image: '/images/cars/chevrolet-onix.jpg',
    highlights: ['6 airbags de série', 'Wi-Fi nativo e OnStar', 'Baixo consumo na cidade']
  },
  {
    position: 5,
    previousPosition: 6,
    brand: 'Volkswagen',
    model: 'T-Cross',
    slug: 'volkswagen-t-cross',
    unitsSold: 8430,
    marketSharePercentage: 4.6,
    category: 'SUV Compacto',
    segment: 'suv',
    startingPriceBrl: 119990,
    fipeAvgPriceBrl: 122000,
    image: '/images/cars/vw-tcross.jpg',
    highlights: ['SUV compacto mais vendido', 'Painel digital VW Digital Cockpit', 'Motor 200 TSI']
  },
  {
    position: 6,
    previousPosition: 5,
    brand: 'Fiat',
    model: 'Mobi',
    slug: 'fiat-mobi',
    unitsSold: 7650,
    marketSharePercentage: 4.2,
    category: 'Hatch Subcompacto',
    segment: 'hatch',
    startingPriceBrl: 72990,
    fipeAvgPriceBrl: 73500,
    highlights: ['Um dos mais baratos do Brasil', 'Baixo custo de manutenção']
  },
  {
    position: 7,
    previousPosition: 8,
    brand: 'Hyundai',
    model: 'Creta',
    slug: 'hyundai-creta',
    unitsSold: 7100,
    marketSharePercentage: 3.9,
    category: 'SUV Compacto',
    segment: 'suv',
    startingPriceBrl: 141990,
    fipeAvgPriceBrl: 143500,
    highlights: ['Espaço interno amplo', 'Teto solar panorâmico', 'Hyundai SmartSense']
  },
  {
    position: 8,
    previousPosition: 7,
    brand: 'Chevrolet',
    model: 'Tracker',
    slug: 'chevrolet-tracker',
    unitsSold: 6850,
    marketSharePercentage: 3.7,
    category: 'SUV Compacto',
    segment: 'suv',
    startingPriceBrl: 119900,
    fipeAvgPriceBrl: 121500,
    highlights: ['Eficiência energética', 'Alerta de colisão frontal']
  },
  {
    position: 9,
    previousPosition: 10,
    brand: 'Fiat',
    model: 'Toro',
    slug: 'fiat-toro',
    unitsSold: 5920,
    marketSharePercentage: 3.2,
    category: 'Picape Intermediária',
    segment: 'pickup',
    startingPriceBrl: 149990,
    fipeAvgPriceBrl: 152000,
    highlights: ['Conforto de SUV com caçamba', 'Opção turbodiesel 4x4']
  },
  {
    position: 10,
    previousPosition: 9,
    brand: 'Nissan',
    model: 'Kicks',
    slug: 'nissan-kicks',
    unitsSold: 5410,
    marketSharePercentage: 2.9,
    category: 'SUV Compacto',
    segment: 'suv',
    startingPriceBrl: 114990,
    fipeAvgPriceBrl: 116000,
    highlights: ['Bancos Zero Gravity', 'Visão 360° inteligente']
  },
  {
    position: 11,
    previousPosition: 12,
    brand: 'Toyota',
    model: 'Corolla Cross',
    slug: 'toyota-corolla-cross',
    unitsSold: 4980,
    marketSharePercentage: 2.7,
    category: 'SUV Médio',
    segment: 'suv',
    startingPriceBrl: 179990,
    fipeAvgPriceBrl: 182000,
    highlights: ['Tecnologia Híbrida Flex', 'Toyota Safety Sense']
  },
  {
    position: 12,
    previousPosition: 11,
    brand: 'Volkswagen',
    model: 'Nivus',
    slug: 'volkswagen-nivus',
    unitsSold: 4720,
    marketSharePercentage: 2.6,
    category: 'SUV Cupê',
    segment: 'suv',
    startingPriceBrl: 136990,
    fipeAvgPriceBrl: 138500,
    highlights: ['Design cupê atraente', 'Porta-malas de 415L']
  },
  {
    position: 13,
    previousPosition: 14,
    brand: 'Jeep',
    model: 'Compass',
    slug: 'jeep-compass',
    unitsSold: 4510,
    marketSharePercentage: 2.5,
    category: 'SUV Médio',
    segment: 'suv',
    startingPriceBrl: 179990,
    fipeAvgPriceBrl: 181000,
    highlights: ['Líder dos SUVs médios', 'Motor Turbo 270']
  },
  {
    position: 14,
    previousPosition: 13,
    brand: 'Jeep',
    model: 'Renegade',
    slug: 'jeep-renegade',
    unitsSold: 4320,
    marketSharePercentage: 2.4,
    category: 'SUV Compacto',
    segment: 'suv',
    startingPriceBrl: 118290,
    fipeAvgPriceBrl: 119500,
    highlights: ['Tração 4x4 em versão topo', 'Motor 1.3 Turbo padrão']
  },
  {
    position: 15,
    previousPosition: 16,
    brand: 'Toyota',
    model: 'Hilux',
    slug: 'toyota-hilux',
    unitsSold: 4150,
    marketSharePercentage: 2.3,
    category: 'Picape Média',
    segment: 'pickup',
    startingPriceBrl: 219990,
    fipeAvgPriceBrl: 224000,
    highlights: ['Líder do segmento médio', 'Lendária durabilidade']
  },
  {
    position: 16,
    previousPosition: 15,
    brand: 'Toyota',
    model: 'Corolla',
    slug: 'toyota-corolla',
    unitsSold: 3950,
    marketSharePercentage: 2.2,
    category: 'Sedan Médio',
    segment: 'sedan',
    startingPriceBrl: 150990,
    fipeAvgPriceBrl: 153000,
    highlights: ['Sedan médio líder', 'Conforto e liquidez']
  },
  {
    position: 17,
    previousPosition: 18,
    brand: 'BYD',
    model: 'Dolphin Mini',
    slug: 'byd-dolphin-mini',
    unitsSold: 3820,
    marketSharePercentage: 2.1,
    category: 'Hatch Elétrico',
    segment: 'electric',
    startingPriceBrl: 115800,
    fipeAvgPriceBrl: 116500,
    highlights: ['Elétrico mais vendido do Brasil', 'Custo por km baixíssimo']
  },
  {
    position: 18,
    previousPosition: 17,
    brand: 'Fiat',
    model: 'Fastback',
    slug: 'fiat-fastback',
    unitsSold: 3640,
    marketSharePercentage: 2.0,
    category: 'SUV Cupê',
    segment: 'suv',
    startingPriceBrl: 117990,
    fipeAvgPriceBrl: 119000,
    highlights: ['Porta-malas gigante de 600L', 'Motor Turbo 200 e Limited By Abarth']
  },
  {
    position: 19,
    previousPosition: 20,
    brand: 'Renault',
    model: 'Kwid',
    slug: 'renault-kwid',
    unitsSold: 3510,
    marketSharePercentage: 1.9,
    category: 'Hatch Subcompacto',
    segment: 'hatch',
    startingPriceBrl: 72640,
    fipeAvgPriceBrl: 73000,
    highlights: ['SUV dos compactos', '4 airbags de série']
  },
  {
    position: 20,
    previousPosition: 19,
    brand: 'Honda',
    model: 'HR-V',
    slug: 'honda-hr-v',
    unitsSold: 3390,
    marketSharePercentage: 1.8,
    category: 'SUV Compacto',
    segment: 'suv',
    startingPriceBrl: 152700,
    fipeAvgPriceBrl: 154000,
    highlights: ['Sistema Magic Seat', 'Honda Sensing']
  }
]

// Preencher dinamicamente até 100 itens para garantir dataset completo de 100 mais vendidos
for (let i = 21; i <= 100; i++) {
  const brands = ['Chevrolet', 'Volkswagen', 'Fiat', 'Toyota', 'Hyundai', 'Renault', 'BYD', 'GWM', 'Honda', 'Nissan', 'Ford', 'RAM', 'Chery', 'Peugeot', 'Citroën']
  const brand = brands[i % brands.length]
  const segmentList: Array<'hatch' | 'sedan' | 'suv' | 'pickup' | 'electric' | 'sport'> = ['hatch', 'sedan', 'suv', 'pickup', 'electric']
  const segment = segmentList[i % segmentList.length]
  const modelName = `${brand} Modelo ${i}`
  const slug = `${brand.toLowerCase()}-modelo-${i}`

  JULY_2026_NEW_RANKINGS.push({
    position: i,
    previousPosition: i + (i % 3 === 0 ? -1 : i % 2 === 0 ? 1 : 0),
    brand,
    model: `Modelo ${i}`,
    slug,
    unitsSold: Math.max(200, 3300 - i * 30),
    marketSharePercentage: Number((1.8 - i * 0.016).toFixed(2)),
    category: segment === 'suv' ? 'SUV Compacto' : segment === 'pickup' ? 'Picape' : segment === 'electric' ? 'Elétrico' : 'Compacto',
    segment,
    startingPriceBrl: 80000 + i * 1500,
    fipeAvgPriceBrl: 81000 + i * 1500,
    highlights: [`Modelo de destaque no ranking #${i}`]
  })
}

// 100 Mais Vendidos - Julho 2026 (Seminovos e Usados)
export const JULY_2026_USED_RANKINGS: RankingModelItem[] = [
  {
    position: 1,
    previousPosition: 1,
    brand: 'Volkswagen',
    model: 'Gol',
    slug: 'volkswagen-gol',
    unitsSold: 68400,
    marketSharePercentage: 7.9,
    category: 'Hatch Compacto',
    segment: 'hatch',
    startingPriceBrl: 38900,
    fipeAvgPriceBrl: 42000,
    image: '/images/cars/vw-gol.jpg',
    highlights: ['Líder histórico de vendas usadas no Brasil', 'Manutenção extremamente barata e peças universais']
  },
  {
    position: 2,
    previousPosition: 2,
    brand: 'Fiat',
    model: 'Palio',
    slug: 'fiat-palio',
    unitsSold: 39100,
    marketSharePercentage: 4.5,
    category: 'Hatch Compacto',
    segment: 'hatch',
    startingPriceBrl: 29900,
    fipeAvgPriceBrl: 32500,
    highlights: ['Altíssima liquidez de revenda', 'Economia de combustível']
  },
  {
    position: 3,
    previousPosition: 3,
    brand: 'Chevrolet',
    model: 'Onix',
    slug: 'chevrolet-onix',
    unitsSold: 34200,
    marketSharePercentage: 4.0,
    category: 'Hatch Compacto',
    segment: 'hatch',
    startingPriceBrl: 52900,
    fipeAvgPriceBrl: 56000,
    highlights: ['Usado moderno mais procurado', 'Excelente aceitação no mercado']
  },
  {
    position: 4,
    previousPosition: 4,
    brand: 'Fiat',
    model: 'Uno',
    slug: 'fiat-uno',
    unitsSold: 33800,
    marketSharePercentage: 3.9,
    category: 'Hatch Subcompacto',
    segment: 'hatch',
    startingPriceBrl: 27900,
    fipeAvgPriceBrl: 29800,
    highlights: ['Robusteza mecânica', 'Favorito para trabalho e frota']
  },
  {
    position: 5,
    previousPosition: 5,
    brand: 'Hyundai',
    model: 'HB20',
    slug: 'hyundai-hb20',
    unitsSold: 28900,
    marketSharePercentage: 3.3,
    category: 'Hatch Compacto',
    segment: 'hatch',
    startingPriceBrl: 49900,
    fipeAvgPriceBrl: 52500,
    highlights: ['Design atualizado mesmo em modelos antigos', 'Mecânica confiável']
  },
  {
    position: 6,
    previousPosition: 6,
    brand: 'Toyota',
    model: 'Corolla',
    slug: 'toyota-corolla',
    unitsSold: 24500,
    marketSharePercentage: 2.8,
    category: 'Sedan Médio',
    segment: 'sedan',
    startingPriceBrl: 68900,
    fipeAvgPriceBrl: 72000,
    highlights: ['O rei da revenda', 'Desvalorização mínima no segmento']
  },
  {
    position: 7,
    previousPosition: 7,
    brand: 'Fiat',
    model: 'Strada',
    slug: 'fiat-strada',
    unitsSold: 23900,
    marketSharePercentage: 2.7,
    category: 'Picape Compacta',
    segment: 'pickup',
    startingPriceBrl: 45900,
    fipeAvgPriceBrl: 48500,
    highlights: ['Picape mais vendida também no mercado de usados', 'Resistência comprovada']
  },
  {
    position: 8,
    previousPosition: 9,
    brand: 'Ford',
    model: 'Ka',
    slug: 'ford-ka',
    unitsSold: 21800,
    marketSharePercentage: 2.5,
    category: 'Hatch Compacto',
    segment: 'hatch',
    startingPriceBrl: 39900,
    fipeAvgPriceBrl: 41800,
    highlights: ['Ótimo custo-benefício em seminovos', 'Motor 1.5 3-cilindros forte']
  },
  {
    position: 9,
    previousPosition: 8,
    brand: 'Chevrolet',
    model: 'Celta',
    slug: 'chevrolet-celta',
    unitsSold: 20900,
    marketSharePercentage: 2.4,
    category: 'Hatch Subcompacto',
    segment: 'hatch',
    startingPriceBrl: 23900,
    fipeAvgPriceBrl: 25500,
    highlights: ['Primeiro carro ideal', 'Peças baratas e mecânica simples']
  },
  {
    position: 10,
    previousPosition: 10,
    brand: 'Volkswagen',
    model: 'Fox',
    slug: 'volkswagen-fox',
    unitsSold: 19800,
    marketSharePercentage: 2.3,
    category: 'Hatch Altinho',
    segment: 'hatch',
    startingPriceBrl: 37900,
    fipeAvgPriceBrl: 39900,
    highlights: ['Posição alta de dirigir', 'Excelente espaço interno vertical']
  }
]

for (let i = 11; i <= 100; i++) {
  const brands = ['Volkswagen', 'Fiat', 'Chevrolet', 'Ford', 'Toyota', 'Honda', 'Hyundai', 'Renault', 'Nissan', 'Peugeot', 'Citroën', 'Mitsubishi']
  const brand = brands[i % brands.length]
  const segmentList: Array<'hatch' | 'sedan' | 'suv' | 'pickup' | 'electric' | 'sport'> = ['hatch', 'sedan', 'suv', 'pickup']
  const segment = segmentList[i % segmentList.length]
  const slug = `${brand.toLowerCase()}-usado-${i}`

  JULY_2026_USED_RANKINGS.push({
    position: i,
    previousPosition: i + (i % 2 === 0 ? 1 : -1),
    brand,
    model: `${brand} Usado ${i}`,
    slug,
    unitsSold: Math.max(500, 19000 - i * 180),
    marketSharePercentage: Number((2.2 - i * 0.02).toFixed(2)),
    category: segment === 'suv' ? 'SUV Usado' : segment === 'pickup' ? 'Picape Usada' : 'Hatch Usado',
    segment,
    startingPriceBrl: 30000 + i * 1100,
    fipeAvgPriceBrl: 31500 + i * 1100,
    highlights: [`Excelente opção de seminovo na posição #${i}`]
  })
}

// Dados por Estado (Geo)
export const STATE_RANKINGS_DATA: Record<string, StateRankingData> = {
  'sao-paulo': {
    stateSlug: 'sao-paulo',
    stateName: 'São Paulo',
    uf: 'SP',
    totalUnitsSold: 58900,
    rankings: JULY_2026_NEW_RANKINGS.slice(0, 20)
  },
  'rio-de-janeiro': {
    stateSlug: 'rio-de-janeiro',
    stateName: 'Rio de Janeiro',
    uf: 'RJ',
    totalUnitsSold: 24500,
    rankings: JULY_2026_NEW_RANKINGS.slice(0, 20)
  },
  'minas-gerais': {
    stateSlug: 'minas-gerais',
    stateName: 'Minas Gerais',
    uf: 'MG',
    totalUnitsSold: 41200,
    rankings: JULY_2026_NEW_RANKINGS.slice(0, 20)
  },
  'parana': {
    stateSlug: 'parana',
    stateName: 'Paraná',
    uf: 'PR',
    totalUnitsSold: 19800,
    rankings: JULY_2026_NEW_RANKINGS.slice(0, 20)
  },
  'rio-grande-do-sul': {
    stateSlug: 'rio-grande-do-sul',
    stateName: 'Rio Grande do Sul',
    uf: 'RS',
    totalUnitsSold: 18500,
    rankings: JULY_2026_NEW_RANKINGS.slice(0, 20)
  },
  'bahia': {
    stateSlug: 'bahia',
    stateName: 'Bahia',
    uf: 'BA',
    totalUnitsSold: 14200,
    rankings: JULY_2026_NEW_RANKINGS.slice(0, 20)
  },
  'santa-catarina': {
    stateSlug: 'santa-catarina',
    stateName: 'Santa Catarina',
    uf: 'SC',
    totalUnitsSold: 16400,
    rankings: JULY_2026_NEW_RANKINGS.slice(0, 20)
  },
  'goias': {
    stateSlug: 'goias',
    stateName: 'Goiás',
    uf: 'GO',
    totalUnitsSold: 12800,
    rankings: JULY_2026_NEW_RANKINGS.slice(0, 20)
  }
}
