export interface CarSpec {
  id: string
  brand: string
  model: string
  version: string
  year: number
  slug: string
  segment: string
  category: string
  priceBrl: number
  engineType: string
  displacement: string
  cylinderCount: number
  turbo: boolean
  horsepower: number
  torque: number
  transmission: string
  drive: string
  lengthMm: number
  widthMm: number
  heightMm: number
  wheelbaseMm: number
  weightKg: number
  trunkCapacity: number
  seats: number
  fuelEconomyCityGas: number
  fuelEconomyRoadGas: number
  topSpeed: number
  acceleration0100: number
  airbagsCount: number
  absBrakes: boolean
  esc: boolean
  hasCarplay: boolean
  hasAndroidAuto: boolean
  hasAc: boolean
  hasRearCamera: boolean
  hasMultimedia: boolean
  hasCruiseCtrl: boolean
  latinNcap: number
  isofix: boolean
  tags: string[]
  isPopular: boolean
  pros: string[]
  cons: string[]
  shortDesc: string
  idealFor: string
  image: string
}

export const cars: CarSpec[] = [
  {
    id: "vw-gol-2024",
    brand: "Volkswagen",
    model: "Gol",
    version: "1.0 TSI Comfortline",
    year: 2024,
    slug: "gol",
    segment: "hatch",
    category: "compacto",
    priceBrl: 75500,
    engineType: "Flex",
    displacement: "1.0",
    cylinderCount: 3,
    turbo: true,
    horsepower: 128,
    torque: 200,
    transmission: "Manual 5",
    drive: "Dianteira",
    lengthMm: 3937,
    widthMm: 1704,
    heightMm: 1475,
    wheelbaseMm: 2465,
    weightKg: 1040,
    trunkCapacity: 285,
    seats: 5,
    fuelEconomyCityGas: 11.3,
    fuelEconomyRoadGas: 13.2,
    topSpeed: 185,
    acceleration0100: 10.8,
    airbagsCount: 4,
    absBrakes: true,
    esc: true,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasAc: true,
    hasRearCamera: true,
    hasMultimedia: true,
    hasCruiseCtrl: false,
    latinNcap: 0,
    isofix: true,
    tags: ["economico", "urbano", "popular"],
    isPopular: true,
    pros: [
      "Consumo excelente para a categoria",
      "Motor turbo com bom desempenho",
      "Custo de manutenção baixo",
      "Central multimídia nativa",
    ],
    cons: [
      "Acabamento interno simples",
      "Porta-malas abaixo da média",
      "Segurança poderia ser melhor",
    ],
    shortDesc: "O Gol é o hatch compacto mais popular do Brasil. Com motor 1.0 TSI, entrega bom desempenho aliado a consumo econômico. Ideal para quem busca um carro urbano, prático e com custo de manutenção acessível.",
    idealFor: "Quem busca um carro urbano e econômico para o dia a dia",
    image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&auto=format&fit=crop",
  },
  {
    id: "hyundai-hb20-2024",
    brand: "Hyundai",
    model: "HB20",
    version: "1.0 TGDI Diamond Plus",
    year: 2024,
    slug: "hb20",
    segment: "hatch",
    category: "compacto",
    priceBrl: 89990,
    engineType: "Flex",
    displacement: "1.0",
    cylinderCount: 3,
    turbo: true,
    horsepower: 120,
    torque: 172,
    transmission: "Automático 6",
    drive: "Dianteira",
    lengthMm: 3870,
    widthMm: 1710,
    heightMm: 1455,
    wheelbaseMm: 2535,
    weightKg: 1075,
    trunkCapacity: 300,
    seats: 5,
    fuelEconomyCityGas: 10.5,
    fuelEconomyRoadGas: 12.8,
    topSpeed: 180,
    acceleration0100: 11.2,
    airbagsCount: 6,
    absBrakes: true,
    esc: true,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasAc: true,
    hasRearCamera: true,
    hasMultimedia: true,
    hasCruiseCtrl: true,
    latinNcap: 4,
    isofix: true,
    tags: ["tecnologia", "seguranca", "urbano"],
    isPopular: true,
    pros: [
      "6 airbags de série",
      "Nota 4 no Latin NCAP",
      "Design moderno e acabamento cuidada",
      "Bom pacote tecnológico",
    ],
    cons: [
      "Preço acima de concorrentes",
      "Porta-malas pequeno",
      "Consumo poderia ser melhor",
    ],
    shortDesc: "O HB20 se destaca em segurança e tecnologia entre os hatches compactos. Com 6 airbags e nota 4 no Latin NCAP, é uma das opções mais seguras da categoria.",
    idealFor: "Quem prioriza segurança e tecnologia no dia a dia",
    image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&auto=format&fit=crop",
  },
  {
    id: "fiat-argo-2024",
    brand: "Fiat",
    model: "Argo",
    version: "1.3 Firefly Drive",
    year: 2024,
    slug: "argo",
    segment: "hatch",
    category: "compacto",
    priceBrl: 72990,
    engineType: "Flex",
    displacement: "1.3",
    cylinderCount: 4,
    turbo: false,
    horsepower: 109,
    torque: 137,
    transmission: "Manual 5",
    drive: "Dianteira",
    lengthMm: 3906,
    widthMm: 1729,
    heightMm: 1518,
    wheelbaseMm: 2527,
    weightKg: 1080,
    trunkCapacity: 300,
    seats: 5,
    fuelEconomyCityGas: 11.0,
    fuelEconomyRoadGas: 12.9,
    topSpeed: 174,
    acceleration0100: 12.5,
    airbagsCount: 4,
    absBrakes: true,
    esc: true,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasAc: true,
    hasRearCamera: true,
    hasMultimedia: true,
    hasCruiseCtrl: false,
    latinNcap: 3,
    isofix: true,
    tags: ["economico", "urbano", "popular"],
    isPopular: true,
    pros: [
      "Bom custo-benefício",
      "Motor Firefly confiável e econômico",
      "Preço acessível",
    ],
    cons: [
      "Desempenho modesto",
      "Acabamento simples",
      "Porta-malas apenas razoável",
    ],
    shortDesc: "O Argo é a entrada perfeita na vida automotiva. Preço acessível, mecânica confiável e economia de combustível fazem dele uma opção racional.",
    idealFor: "Primeiro carro ou quem busca economia no dia a dia",
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&auto=format&fit=crop",
  },
  {
    id: "chevrolet-onix-2024",
    brand: "Chevrolet",
    model: "Onix",
    version: "1.0 Turbo Premier",
    year: 2024,
    slug: "onix",
    segment: "hatch",
    category: "compacto",
    priceBrl: 96990,
    engineType: "Flex",
    displacement: "1.0",
    cylinderCount: 3,
    turbo: true,
    horsepower: 116,
    torque: 165,
    transmission: "Automático 6",
    drive: "Dianteira",
    lengthMm: 3940,
    widthMm: 1717,
    heightMm: 1457,
    wheelbaseMm: 2551,
    weightKg: 1060,
    trunkCapacity: 303,
    seats: 5,
    fuelEconomyCityGas: 11.4,
    fuelEconomyRoadGas: 13.1,
    topSpeed: 178,
    acceleration0100: 11.5,
    airbagsCount: 6,
    absBrakes: true,
    esc: true,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasAc: true,
    hasRearCamera: true,
    hasMultimedia: true,
    hasCruiseCtrl: true,
    latinNcap: 5,
    isofix: true,
    tags: ["seguranca", "tecnologia", "urbano"],
    isPopular: true,
    pros: [
      "Nota 5 no Latin NCAP",
      "Melhor segurança da categoria",
      "Bom consumo para turbo",
      "Central multimídia ampla",
    ],
    cons: [
      "Preço elevado para a categoria",
      "Manutenção mais cara que rivais",
      "Suspensão firme demais",
    ],
    shortDesc: "O Onix é o hatch mais seguro do Brasil com nota 5 no Latin NCAP. Tecnológico, econômico e completo — mas com preço premium.",
    idealFor: "Famílias que priorizam segurança acima de tudo",
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&auto=format&fit=crop",
  },
  {
    id: "fiat-pulse-2024",
    brand: "Fiat",
    model: "Pulse",
    version: "1.3 Firefly Audace",
    year: 2024,
    slug: "pulse",
    segment: "suv",
    category: "medio",
    priceBrl: 105990,
    engineType: "Flex",
    displacement: "1.3",
    cylinderCount: 4,
    turbo: false,
    horsepower: 109,
    torque: 137,
    transmission: "CVT",
    drive: "Dianteira",
    lengthMm: 4119,
    widthMm: 1775,
    heightMm: 1576,
    wheelbaseMm: 2570,
    weightKg: 1155,
    trunkCapacity: 308,
    seats: 5,
    fuelEconomyCityGas: 10.2,
    fuelEconomyRoadGas: 12.1,
    topSpeed: 168,
    acceleration0100: 13.2,
    airbagsCount: 4,
    absBrakes: true,
    esc: true,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasAc: true,
    hasRearCamera: true,
    hasMultimedia: true,
    hasCruiseCtrl: true,
    latinNcap: 4,
    isofix: true,
    tags: ["familia", "urbano", "suv"],
    isPopular: true,
    pros: [
      "Altura do solo boa para uso urbano",
      "Design moderno e robusto",
      "Bom pacote de segurança",
    ],
    cons: [
      "Motor aspirado fraco para SUV",
      "Porta-malas pequeno para a categoria",
      "Consumo acima dos rivais",
    ],
    shortDesc: "O Pulse é o SUV compacto da Fiat, ideal para quem quer posição de dirigir mais alta sem pagar preço de SUV médio.",
    idealFor: "Quem quer um SUV básico para uso urbano",
    image: "https://images.unsplash.com/photo-1606611013016-969c19ba2a25?w=800&auto=format&fit=crop",
  },
  {
    id: "toyota-corolla-2024",
    brand: "Toyota",
    model: "Corolla",
    version: "2.0 XEi Dynamic Force",
    year: 2024,
    slug: "corolla",
    segment: "sedan",
    category: "medio",
    priceBrl: 149990,
    engineType: "Flex",
    displacement: "2.0",
    cylinderCount: 4,
    turbo: false,
    horsepower: 177,
    torque: 210,
    transmission: "CVT 10",
    drive: "Dianteira",
    lengthMm: 4630,
    widthMm: 1780,
    heightMm: 1435,
    wheelbaseMm: 2700,
    weightKg: 1380,
    trunkCapacity: 470,
    seats: 5,
    fuelEconomyCityGas: 9.7,
    fuelEconomyRoadGas: 12.3,
    topSpeed: 200,
    acceleration0100: 9.5,
    airbagsCount: 7,
    absBrakes: true,
    esc: true,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasAc: true,
    hasRearCamera: true,
    hasMultimedia: true,
    hasCruiseCtrl: true,
    latinNcap: 5,
    isofix: true,
    tags: ["familia", "viagem", "premium"],
    isPopular: true,
    pros: [
      "Confiabilidade Toyota lendária",
      "Excelente valor de revenda",
      "7 airbags, nota 5 NCAP",
      "Motor potente e econômico",
      "Porta-malas generoso",
    ],
    cons: [
      "Preço acima de concorrentes",
      "Consumo urbano poderia ser melhor",
      "Porta-malas poderia ser melhor",
    ],
    shortDesc: "O Corolla é referência em confiabilidade e valor de revenda. Sedã médio completo, seguro e com mecânica de primeira.",
    idealFor: "Quem quer um sedã confiável para família e viagens",
    image: "https://images.unsplash.com/photo-1621007890657-93d3859b6e8c?w=800&auto=format&fit=crop",
  },
  {
    id: "jeep-compass-2024",
    brand: "Jeep",
    model: "Compass",
    version: "270T Longitude",
    year: 2024,
    slug: "compass",
    segment: "suv",
    category: "medio",
    priceBrl: 169990,
    engineType: "Flex",
    displacement: "1.3",
    cylinderCount: 4,
    turbo: true,
    horsepower: 185,
    torque: 270,
    transmission: "Automático 6",
    drive: "Dianteira",
    lengthMm: 4405,
    widthMm: 1815,
    heightMm: 1620,
    wheelbaseMm: 2635,
    weightKg: 1520,
    trunkCapacity: 438,
    seats: 5,
    fuelEconomyCityGas: 9.5,
    fuelEconomyRoadGas: 11.8,
    topSpeed: 205,
    acceleration0100: 8.9,
    airbagsCount: 6,
    absBrakes: true,
    esc: true,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasAc: true,
    hasRearCamera: true,
    hasMultimedia: true,
    hasCruiseCtrl: true,
    latinNcap: 5,
    isofix: true,
    tags: ["familia", "viagem", "desempenho"],
    isPopular: true,
    pros: [
      "Design icônico e imponente",
      "Motor turbo potente",
      "Excelente acabamento interno",
      "Nota 5 no Latin NCAP",
    ],
    cons: [
      "Preço elevado",
      "Consumo urbano alto",
      "Manutenção cara",
    ],
    shortDesc: "O Compass é o SUV médio mais desejado do Brasil. Design robusto, motor potente e acabamento premium justificam o investimento.",
    idealFor: "Famílias que buscam espaço, conforto e status",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop",
  },
  {
    id: "honda-civic-2024",
    brand: "Honda",
    model: "Civic",
    version: "2.0 e:HEV Hybrid",
    year: 2024,
    slug: "civic",
    segment: "sedan",
    category: "medio",
    priceBrl: 179990,
    engineType: "Híbrido",
    displacement: "2.0",
    cylinderCount: 4,
    turbo: false,
    horsepower: 185,
    torque: 179,
    transmission: "e-CVT",
    drive: "Dianteira",
    lengthMm: 4674,
    widthMm: 1802,
    heightMm: 1415,
    wheelbaseMm: 2735,
    weightKg: 1440,
    trunkCapacity: 410,
    seats: 5,
    fuelEconomyCityGas: 14.3,
    fuelEconomyRoadGas: 15.8,
    topSpeed: 195,
    acceleration0100: 8.9,
    airbagsCount: 6,
    absBrakes: true,
    esc: true,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasAc: true,
    hasRearCamera: true,
    hasMultimedia: true,
    hasCruiseCtrl: true,
    latinNcap: 5,
    isofix: true,
    tags: ["tecnologia", "economico", "desempenho"],
    isPopular: false,
    pros: [
      "Híbrido = consumo excepcional",
      "Desempenho excelente",
      "Tecnologia de ponta",
      "Qualidade Honda",
    ],
    cons: [
      "Preço muito elevado",
      "Manutenção especializada cara",
      "Porta-malas menor que rivais",
    ],
    shortDesc: "O Civic híbrido combina desempenho com consumo excepcional. Tecnologia de ponta Honda com o conforto de um sedã premium.",
    idealFor: "Quem quer o melhor da tecnologia com economia de combustível",
    image: "https://images.unsplash.com/photo-1606611013016-969c19ba2a25?w=800&auto=format&fit=crop",
  },
  {
    id: "vw-t-cross-2024",
    brand: "Volkswagen",
    model: "T-Cross",
    version: "250 TSI Comfortline",
    year: 2024,
    slug: "t-cross",
    segment: "suv",
    category: "medio",
    priceBrl: 139990,
    engineType: "Flex",
    displacement: "1.4",
    cylinderCount: 4,
    turbo: true,
    horsepower: 150,
    torque: 250,
    transmission: "Automático 6",
    drive: "Dianteira",
    lengthMm: 4199,
    widthMm: 1778,
    heightMm: 1574,
    wheelbaseMm: 2651,
    weightKg: 1278,
    trunkCapacity: 373,
    seats: 5,
    fuelEconomyCityGas: 9.8,
    fuelEconomyRoadGas: 11.9,
    topSpeed: 195,
    acceleration0100: 9.7,
    airbagsCount: 4,
    absBrakes: true,
    esc: true,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasAc: true,
    hasRearCamera: true,
    hasMultimedia: true,
    hasCruiseCtrl: true,
    latinNcap: 4,
    isofix: true,
    tags: ["familia", "viagem", "desempenho"],
    isPopular: true,
    pros: [
      "Motor 1.4 TSI consagrado",
      "Bom desempenho para categoria",
      "Espaço interno bom",
      "Bom valor de revenda",
    ],
    cons: [
      "Apenas 4 airbags",
      "Preço alto para o pacote",
      "Traseira polêmica",
    ],
    shortDesc: "O T-Cross junta o motor 1.4 TSI de fama com a altura e presença de um SUV. Bom para famílias que não querem abrir mão de desempenho.",
    idealFor: "Família que quer um SUV com bom desempenho",
    image: "https://images.unsplash.com/photo-1519641471654-76ce0e58708e?w=800&auto=format&fit=crop",
  },
  {
    id: "renault-kwid-2024",
    brand: "Renault",
    model: "Kwid",
    version: "1.0 Zen",
    year: 2024,
    slug: "kwid",
    segment: "hatch",
    category: "compacto",
    priceBrl: 62990,
    engineType: "Flex",
    displacement: "1.0",
    cylinderCount: 3,
    turbo: false,
    horsepower: 70,
    torque: 94,
    transmission: "Manual 5",
    drive: "Dianteira",
    lengthMm: 3679,
    widthMm: 1662,
    heightMm: 1494,
    wheelbaseMm: 2423,
    weightKg: 905,
    trunkCapacity: 290,
    seats: 5,
    fuelEconomyCityGas: 11.8,
    fuelEconomyRoadGas: 13.6,
    topSpeed: 155,
    acceleration0100: 16.2,
    airbagsCount: 2,
    absBrakes: true,
    esc: false,
    hasCarplay: false,
    hasAndroidAuto: false,
    hasAc: true,
    hasRearCamera: false,
    hasMultimedia: false,
    hasCruiseCtrl: false,
    latinNcap: 0,
    isofix: true,
    tags: ["economico", "urbano", "popular"],
    isPopular: true,
    pros: [
      "Carro mais barato do Brasil",
      "Consumo muito bom",
      "Altura boa para buracos",
      "Fácil de estacionar",
    ],
    cons: [
      "Segurança muito básica",
      "Desempenho fraco",
      "Acabamento muito simples",
      "Apenas 2 airbags",
    ],
    shortDesc: "O Kwid é o carro mais barato do Brasil. Ideal para quem precisa de um veículo básico, econômico e funcional para locomoção urbana.",
    idealFor: "Quem precisa do carro mais barato possível para se locomover",
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&auto=format&fit=crop",
  },
  {
    id: "caoa-chery-tiggo-2024",
    brand: "Caoa Chery",
    model: "Tiggo 5x",
    version: "1.5T Premium",
    year: 2024,
    slug: "tiggo-5x",
    segment: "suv",
    category: "medio",
    priceBrl: 129990,
    engineType: "Flex",
    displacement: "1.5",
    cylinderCount: 4,
    turbo: true,
    horsepower: 147,
    torque: 210,
    transmission: "CVT",
    drive: "Dianteira",
    lengthMm: 4318,
    widthMm: 1838,
    heightMm: 1615,
    wheelbaseMm: 2630,
    weightKg: 1348,
    trunkCapacity: 340,
    seats: 5,
    fuelEconomyCityGas: 9.3,
    fuelEconomyRoadGas: 11.2,
    topSpeed: 182,
    acceleration0100: 11.0,
    airbagsCount: 4,
    absBrakes: true,
    esc: true,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasAc: true,
    hasRearCamera: true,
    hasMultimedia: true,
    hasCruiseCtrl: true,
    latinNcap: 0,
    isofix: true,
    tags: ["tecnologia", "familia", "custo-beneficio"],
    isPopular: false,
    pros: [
      "Mais completo pelo preço",
      "Bom espaço interno",
      "Design moderno",
    ],
    cons: [
      "Sem teste de segurança",
      "Rede de concessionários pequena",
      "Desvalorização alta",
    ],
    shortDesc: "O Tiggo 5x entrega muito equipamento por um preço menor que rivais consolidados. Bom para quem prioriza custo-benefício.",
    idealFor: "Quem busca um SUV completo com melhor custo-benefício",
    image: "https://images.unsplash.com/photo-1519641471654-76ce0e58708e?w=800&auto=format&fit=crop",
  },
  {
    id: "nissan-kicks-2024",
    brand: "Nissan",
    model: "Kicks",
    version: "1.6 CVT Advance",
    year: 2024,
    slug: "kicks",
    segment: "suv",
    category: "medio",
    priceBrl: 144990,
    engineType: "Flex",
    displacement: "1.6",
    cylinderCount: 4,
    turbo: false,
    horsepower: 114,
    torque: 152,
    transmission: "CVT",
    drive: "Dianteira",
    lengthMm: 4300,
    widthMm: 1760,
    heightMm: 1590,
    wheelbaseMm: 2620,
    weightKg: 1265,
    trunkCapacity: 432,
    seats: 5,
    fuelEconomyCityGas: 10.1,
    fuelEconomyRoadGas: 12.6,
    topSpeed: 172,
    acceleration0100: 12.8,
    airbagsCount: 6,
    absBrakes: true,
    esc: true,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasAc: true,
    hasRearCamera: true,
    hasMultimedia: true,
    hasCruiseCtrl: true,
    latinNcap: 4,
    isofix: true,
    tags: ["familia", "urban", "seguranca"],
    isPopular: false,
    pros: [
      "Porta-malas generoso",
      "Conforto de marcha excelente",
      "Bom pacote de segurança",
    ],
    cons: [
      "Motor aspirado fraco",
      "Desempenho modesto",
      "Design conservador",
    ],
    shortDesc: "O Kicks é o SUV confortável e racional. Não é o mais emocionante, mas é um dos melhores para uso diário em família.",
    idealFor: "Família que prioriza conforto e espaço",
    image: "https://images.unsplash.com/photo-1606611013016-969c19ba2a25?w=800&auto=format&fit=crop",
  },
]

export const brands = [...new Set(cars.map(c => c.brand))].sort()

export const segments = [...new Set(cars.map(c => c.segment))].sort()

export const priceRanges = [
  { label: "Até R$ 70k", max: 70000 },
  { label: "R$ 70k - R$ 100k", max: 100000, min: 70000 },
  { label: "R$ 100k - R$ 150k", max: 150000, min: 100000 },
  { label: "R$ 150k+", min: 150000 },
]

export const profiles = [
  { id: "economico", label: "Econômico", desc: "Menor consumo de combustível" },
  { id: "familia", label: "Família", desc: "Porta-malas generoso e bom espaço" },
  { id: "seguranca", label: "Segurança", desc: "Mais airbags e melhor Latin NCAP" },
  { id: "tecnologia", label: "Tecnologia", desc: "Mais recursos tecnológicos" },
  { id: "desempenho", label: "Desempenho", desc: "Mais potência e torque" },
  { id: "custo-beneficio", label: "Custo-Benefício", desc: "Melhor relação qualidade/preço" },
]

// Utility functions
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function getCarBySlug(slug: string): CarSpec | undefined {
  return cars.find(c => c.slug === slug)
}

export function getCarById(id: string): CarSpec | undefined {
  return cars.find(c => c.id === id)
}

export function getCarsByBrand(brand: string): CarSpec[] {
  return cars.filter(c => c.brand === brand)
}

export function getCarsBySegment(segment: string): CarSpec[] {
  return cars.filter(c => c.segment === segment)
}

export function getCarsByPriceRange(min?: number, max?: number): CarSpec[] {
  return cars.filter(c => {
    if (min && c.priceBrl < min) return false
    if (max && c.priceBrl > max) return false
    return true
  })
}

export function searchCars(query: string): CarSpec[] {
  const q = query.toLowerCase()
  return cars.filter(c =>
    c.brand.toLowerCase().includes(q) ||
    c.model.toLowerCase().includes(q) ||
    c.version.toLowerCase().includes(q) ||
    c.tags.some(t => t.includes(q)) ||
    c.segment.toLowerCase().includes(q)
  )
}

export function matchCarToProfile(c: CarSpec, profileId: string): number {
  switch (profileId) {
    case "economico": {
      const best = Math.max(...cars.map(car => car.fuelEconomyCityGas))
      const worst = Math.min(...cars.map(car => car.fuelEconomyCityGas))
      return c.priceBrl < 90000 ? ((c.fuelEconomyCityGas - worst) / (best - worst)) * 70 + 30 : ((c.fuelEconomyCityGas - worst) / (best - worst)) * 50 + 20
    }
    case "familia": {
      const bestTrunk = Math.max(...cars.map(car => car.trunkCapacity))
      const bestWb = Math.max(...cars.map(car => car.wheelbaseMm))
      const trunkScore = (c.trunkCapacity / bestTrunk) * 50
      const wbScore = (c.wheelbaseMm / bestWb) * 50
      return trunkScore + wbScore
    }
    case "seguranca": {
      const maxAirbags = Math.max(...cars.map(car => car.airbagsCount))
      const airbagScore = (c.airbagsCount / maxAirbags) * 60
      const ncapScore = (c.latinNcap / 5) * 40
      return airbagScore + ncapScore
    }
    case "tecnologia": {
      let score = 0
      if (c.hasCarplay) score += 10
      if (c.hasAndroidAuto) score += 10
      if (c.hasMultimedia) score += 15
      if (c.hasCruiseCtrl) score += 10
      if (c.hasRearCamera) score += 15
      if (c.esc) score += 10
      if (c.latinNcap >= 4) score += 15
      if (c.isofix) score += 5
      if (c.transmission.includes("Automático") || c.transmission.includes("CVT")) score += 10
      return score
    }
    case "desempenho": {
      const bestHp = Math.max(...cars.map(car => car.horsepower))
      const bestTorque = Math.max(...cars.map(car => car.torque))
      const hpScore = (c.horsepower / bestHp) * 50
      const torqueScore = (c.torque / bestTorque) * 50
      return hpScore + torqueScore
    }
    case "custo-beneficio": {
      const worstPrice = Math.max(...cars.map(car => car.priceBrl))
      const bestPrice = Math.min(...cars.map(car => car.priceBrl))
      const priceScore = ((worstPrice - c.priceBrl) / (worstPrice - bestPrice)) * 40
      let techScore = 0
      if (c.hasCarplay) techScore += 5
      if (c.hasMultimedia) techScore += 5
      if (c.hasCruiseCtrl) techScore += 5
      if (c.esc) techScore += 5
      if (c.airbagsCount >= 4) techScore += 10
      if (c.latinNcap >= 4) techScore += 10
      if (c.turbo) techScore += 5
      return priceScore + Math.min(techScore, 60)
    }
    default:
      return 50
  }
}

export function compareCars(carIds: string[]): { cars: CarSpec[], winners: Record<string, string> } {
  const matched = carIds.map(id => getCarById(id)).filter(Boolean) as CarSpec[]
  const winners: Record<string, string> = {}
  const comparisons = [
    { key: "priceBrl", label: "Preço", lower: true },
    { key: "fuelEconomyCityGas", label: "Consumo Cidade", lower: false },
    { key: "horsepower", label: "Potência", lower: false },
    { key: "torque", label: "Torque", lower: false },
    { key: "trunkCapacity", label: "Porta-Malas", lower: false },
    { key: "latinNcap", label: "Segurança NCAP", lower: false },
    { key: "airbagsCount", label: "Airbags", lower: false },
  ]

  for (const comp of comparisons) {
    let bestCar = matched[0]
    for (const car of matched) {
      const val = car[comp.key as keyof CarSpec] as number
      const bestVal = bestCar[comp.key as keyof CarSpec] as number
      if (comp.lower ? val < bestVal : val > bestVal) {
        bestCar = car
      }
    }
    winners[comp.key] = bestCar.id
  }

  return { cars: matched, winners }
}
