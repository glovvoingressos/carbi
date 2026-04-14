/**
 * Sistema de Enriquecimento Automático de Veículos
 * 
 * Funciona para QUALQUER carro anunciado na plataforma, similar a WebMotors/OLX.
 * 
 * Fontes de dados (por ordem de prioridade):
 * 1. Auto.dev (via VIN) - dados completos e precisos
 * 2. Catálogo estático - dados técnicos detalhados
 * 3. Inferência inteligente - baseado no modelo/versão da FIPE
 */

interface VehicleData {
  brand: string
  model: string
  version: string | null
  year: number
  yearModel: number
}

interface EnrichedSpecs {
  engine: string | null
  horsepower: number | null
  torque: number | null
  transmission: string | null
  fuel: string | null
  drive: string | null
  displacement: string | null
  engineType: string | null
  turbo: boolean | null
  doors: number | null
  seats: number | null
  trunkCapacity: number | null
  weightKg: number | null
  lengthMm: number | null
  widthMm: number | null
  heightMm: number | null
  wheelbaseMm: number | null
  topSpeed: number | null
  acceleration0100: number | null
  fuelEconomyCityGas: number | null
  fuelEconomyRoadGas: number | null
  airbagsCount: number | null
  latinNcap: number | null
  hasCarplay: boolean | null
  hasAndroidAuto: boolean | null
  hasMultimedia: boolean | null
  hasRearCamera: boolean | null
  hasCruiseCtrl: boolean | null
  hasAc: boolean | null
  absBrakes: boolean | null
  esc: boolean | null
  isofix: boolean | null
  bodyType: string | null
  category: string | null
}

/**
 * Banco de dados de inferência inteligente
 * Mapeia padrões de modelos para especificações técnicas aproximadas
 */
const VEHICLE_SPECS_DB: Record<string, Partial<EnrichedSpecs>> = {
  // ===== SUVs POPULARES =====
  'suzuki swift': {
    category: 'hatch',
    fuel: 'Flex',
    transmission: 'Automático CVT',
    engineType: 'Flex',
    displacement: '1.2',
    turbo: false,
    horsepower: 90,
    torque: 115,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 265,
    weightKg: 975,
    fuelEconomyCityGas: 12.5,
    fuelEconomyRoadGas: 14.2,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 6,
  },
  'kia sportage': {
    category: 'suv',
    fuel: 'Flex',
    transmission: 'Automático 6',
    engineType: 'Flex',
    displacement: '2.0',
    turbo: false,
    horsepower: 155,
    torque: 196,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 465,
    weightKg: 1500,
    fuelEconomyCityGas: 9.8,
    fuelEconomyRoadGas: 11.5,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 6,
  },
  'toyota rav4': {
    category: 'suv',
    fuel: 'Híbrido',
    transmission: 'Automático CVT',
    engineType: 'Híbrido Flex',
    displacement: '2.5',
    turbo: false,
    horsepower: 222,
    torque: 221,
    drive: 'AWD',
    doors: 4,
    seats: 5,
    trunkCapacity: 580,
    weightKg: 1700,
    fuelEconomyCityGas: 15.0,
    fuelEconomyRoadGas: 13.5,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 7,
    latinNcap: 5,
  },
  'honda fit': {
    category: 'hatch',
    fuel: 'Flex',
    transmission: 'Automático CVT',
    engineType: 'Flex',
    displacement: '1.5',
    turbo: false,
    horsepower: 116,
    torque: 155,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 363,
    weightKg: 1150,
    fuelEconomyCityGas: 12.0,
    fuelEconomyRoadGas: 13.8,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 6,
  },
  'chevrolet cruze': {
    category: 'sedan',
    fuel: 'Flex',
    transmission: 'Automático 6',
    engineType: 'Flex',
    displacement: '1.4',
    turbo: true,
    horsepower: 153,
    torque: 240,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 450,
    weightKg: 1350,
    fuelEconomyCityGas: 10.5,
    fuelEconomyRoadGas: 12.8,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 6,
  },
  'volkswagen jetta': {
    category: 'sedan',
    fuel: 'Flex',
    transmission: 'Automático 6',
    engineType: 'Flex',
    displacement: '1.4',
    turbo: true,
    horsepower: 150,
    torque: 250,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 510,
    weightKg: 1380,
    fuelEconomyCityGas: 10.2,
    fuelEconomyRoadGas: 12.5,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 6,
  },
  'hyundai hb20': {
    category: 'hatch',
    fuel: 'Flex',
    transmission: 'Automático 6',
    engineType: 'Flex',
    displacement: '1.0',
    turbo: true,
    horsepower: 120,
    torque: 172,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 300,
    weightKg: 1050,
    fuelEconomyCityGas: 11.5,
    fuelEconomyRoadGas: 13.0,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 6,
  },
  'jeep compass': {
    category: 'suv',
    fuel: 'Flex',
    transmission: 'Automático 6',
    engineType: 'Flex',
    displacement: '1.3',
    turbo: true,
    horsepower: 185,
    torque: 270,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 476,
    weightKg: 1515,
    fuelEconomyCityGas: 10.3,
    fuelEconomyRoadGas: 12.1,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 6,
    latinNcap: 5,
  },
  'toyota corolla': {
    category: 'sedan',
    fuel: 'Flex',
    transmission: 'Automático CVT',
    engineType: 'Flex',
    displacement: '2.0',
    turbo: false,
    horsepower: 177,
    torque: 210,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 470,
    weightKg: 1380,
    fuelEconomyCityGas: 11.0,
    fuelEconomyRoadGas: 13.5,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 7,
    latinNcap: 5,
  },
  'honda civic': {
    category: 'sedan',
    fuel: 'Flex',
    transmission: 'Automático CVT',
    engineType: 'Flex',
    displacement: '1.5',
    turbo: true,
    horsepower: 180,
    torque: 240,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 519,
    weightKg: 1350,
    fuelEconomyCityGas: 11.2,
    fuelEconomyRoadGas: 13.0,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 6,
    latinNcap: 5,
  },
  'vw polo': {
    category: 'hatch',
    fuel: 'Flex',
    transmission: 'Automático 6',
    engineType: 'Flex',
    displacement: '1.0',
    turbo: true,
    horsepower: 128,
    torque: 200,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 300,
    weightKg: 1080,
    fuelEconomyCityGas: 11.0,
    fuelEconomyRoadGas: 13.2,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 6,
  },
  'fiat pulse': {
    category: 'suv',
    fuel: 'Flex',
    transmission: 'Automático CVT',
    engineType: 'Flex',
    displacement: '1.3',
    turbo: true,
    horsepower: 185,
    torque: 270,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 370,
    weightKg: 1281,
    fuelEconomyCityGas: 10.0,
    fuelEconomyRoadGas: 12.3,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 4,
  },
  'renault kardian': {
    category: 'suv',
    fuel: 'Flex',
    transmission: 'Automático 6',
    engineType: 'Flex',
    displacement: '1.0',
    turbo: true,
    horsepower: 130,
    torque: 220,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 390,
    weightKg: 1200,
    fuelEconomyCityGas: 11.0,
    fuelEconomyRoadGas: 12.5,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 4,
  },
  'volkswagen tera': {
    category: 'suv',
    fuel: 'Flex',
    transmission: 'Automático 6',
    engineType: 'Flex',
    displacement: '1.0',
    turbo: true,
    horsepower: 128,
    torque: 200,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 380,
    weightKg: 1150,
    fuelEconomyCityGas: 11.5,
    fuelEconomyRoadGas: 13.0,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 6,
  },
  'fiat fastback': {
    category: 'suv',
    fuel: 'Flex',
    transmission: 'Automático 6',
    engineType: 'Flex',
    displacement: '1.3',
    turbo: true,
    horsepower: 185,
    torque: 270,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 600,
    weightKg: 1304,
    fuelEconomyCityGas: 11.3,
    fuelEconomyRoadGas: 13.9,
    hasCarplay: true,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 4,
  },
  'byd song plus': {
    category: 'suv',
    fuel: 'Híbrido Plug-in',
    transmission: 'Automático 1',
    engineType: 'Híbrido Plug-in',
    displacement: '1.5',
    turbo: false,
    horsepower: 325,
    torque: 530,
    drive: 'Dianteira',
    doors: 4,
    seats: 5,
    trunkCapacity: 520,
    weightKg: 1900,
    fuelEconomyCityGas: 18.0,
    fuelEconomyRoadGas: 15.0,
    hasCarplay: false,
    hasAndroidAuto: true,
    hasMultimedia: true,
    hasRearCamera: true,
    hasCruiseCtrl: true,
    hasAc: true,
    absBrakes: true,
    esc: true,
    isofix: true,
    airbagsCount: 6,
  },
}

/**
 * Infer specs baseados no modelo/versão
 * Usa regex para extrair informações do texto do modelo/versão
 */
function inferSpecsFromText(
  model: string,
  version: string | null,
  year: number
): Partial<EnrichedSpecs> {
  const text = `${model} ${version || ''}`.toLowerCase()
  const specs: Partial<EnrichedSpecs> = {}

  // Infer combustível
  if (text.includes('flex')) specs.fuel = 'Flex'
  else if (text.includes('diesel')) specs.fuel = 'Diesel'
  else if (text.includes('gasolina') || text.includes('gas')) specs.fuel = 'Gasolina'
  else if (text.includes('etanol')) specs.fuel = 'Etanol'
  else if (text.includes('hibrido') || text.includes('híbrido') || text.includes('hev')) specs.fuel = 'Híbrido'
  else if (text.includes('plug-in') || text.includes('phev')) specs.fuel = 'Híbrido Plug-in'
  else if (text.includes('eletric') || text.includes('ev') || text.includes('bev')) specs.fuel = 'Elétrico'

  // Infer turbo
  if (text.includes('turbo') || text.includes('tb') || text.includes('tgi') || text.includes('tsi') || text.includes('thp') || text.includes('tgdi')) {
    specs.turbo = true
  } else if (text.includes('aspirado') || text.includes('asp')) {
    specs.turbo = false
  }

  // Infer cilindrada do texto (ex: "1.0", "1.5", "2.0")
  const displacementMatch = text.match(/(\d\.?\d)\s*(l|litro)/)
  if (displacementMatch) {
    specs.displacement = displacementMatch[1]
  }

  // Infer câmbio
  if (text.includes('cvt')) specs.transmission = 'Automático CVT'
  else if (text.includes('automat') || text.includes('aut.')) specs.transmission = 'Automático'
  else if (text.includes('manual')) specs.transmission = 'Manual'
  else if (text.includes('dsg') || text.includes('dupla embreagem')) specs.transmission = 'Automático de dupla embreagem'

  // Infer tração
  if (text.includes('4x4') || text.includes('4wd') || text.includes('awd') || text.includes('integral') || text.includes('quattro')) {
    specs.drive = 'AWD'
  } else if (text.includes('fwd') || text.includes('dianteira') || text.includes('traction')) {
    specs.drive = 'Dianteira'
  } else if (text.includes('traseira') || text.includes('rwd')) {
    specs.drive = 'Traseira'
  }

  // Infer categoria pelo modelo
  if (text.includes('suv') || text.includes('cross') || text.includes('compass') || text.includes('tracker') || text.includes('pulse') || text.includes('fastback') || text.includes('duster') || text.includes('kicks') || text.includes('creta') || text.includes('t-cross') || text.includes('taos')) {
    specs.category = 'SUV'
    specs.bodyType = 'SUV'
  } else if (text.includes('sedan') || text.includes('plus') || text.includes('onix plus') || text.includes('city') || text.includes('civic') || text.includes('corolla')) {
    specs.category = 'sedan'
    specs.bodyType = 'Sedan'
  } else if (text.includes('hatch') || text.includes('polo') || text.includes('argo') || text.includes('hb20') || text.includes('gol')) {
    specs.category = 'hatch'
    specs.bodyType = 'Hatch'
  } else if (text.includes('picape') || text.includes('pickup') || text.includes('ranger') || text.includes('hilux') || text.includes('s10') || text.includes('toro') || text.includes('strada')) {
    specs.category = 'pickup'
    specs.bodyType = 'Picape'
  } else if (text.includes('sw') || text.includes('perua') || text.includes('station')) {
    specs.category = 'perua'
    specs.bodyType = 'Perua'
  }

  return specs
}

/**
 * Função principal de enriquecimento
 * Tenta encontrar specs para QUALQUER veículo anunciado
 */
export function enrichVehicle(
  vehicle: VehicleData,
  catalogMatch?: any
): EnrichedSpecs {
  const modelKey = `${vehicle.brand} ${vehicle.model}`.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Estratégia 1: Catálogo estático (prioridade máxima)
  if (catalogMatch) {
    return {
      engine: catalogMatch.displacement || null,
      horsepower: catalogMatch.horsepower || null,
      torque: catalogMatch.torque || null,
      transmission: catalogMatch.transmission || null,
      fuel: catalogMatch.engineType || null,
      drive: catalogMatch.drive || null,
      displacement: catalogMatch.displacement || null,
      engineType: catalogMatch.engineType || null,
      turbo: catalogMatch.turbo || null,
      doors: 4,
      seats: catalogMatch.seats || null,
      trunkCapacity: catalogMatch.trunkCapacity || null,
      weightKg: catalogMatch.weightKg || null,
      lengthMm: catalogMatch.lengthMm || null,
      widthMm: catalogMatch.widthMm || null,
      heightMm: catalogMatch.heightMm || null,
      wheelbaseMm: catalogMatch.wheelbaseMm || null,
      topSpeed: catalogMatch.topSpeed || null,
      acceleration0100: catalogMatch.acceleration0100 || null,
      fuelEconomyCityGas: catalogMatch.fuelEconomyCityGas || null,
      fuelEconomyRoadGas: catalogMatch.fuelEconomyRoadGas || null,
      airbagsCount: catalogMatch.airbagsCount || null,
      latinNcap: catalogMatch.latinNcap || null,
      hasCarplay: catalogMatch.hasCarplay || null,
      hasAndroidAuto: catalogMatch.hasAndroidAuto || null,
      hasMultimedia: catalogMatch.hasMultimedia || null,
      hasRearCamera: catalogMatch.hasRearCamera || null,
      hasCruiseCtrl: catalogMatch.hasCruiseCtrl || null,
      hasAc: catalogMatch.hasAc || null,
      absBrakes: catalogMatch.absBrakes || null,
      esc: catalogMatch.esc || null,
      isofix: catalogMatch.isofix || null,
      bodyType: null,
      category: catalogMatch.segment || null,
    }
  }

  // Estratégia 2: Banco de dados de inferência
  const foundSpecs = Object.entries(VEHICLE_SPECS_DB).find(([key]) => {
    return modelKey.includes(key) || key.includes(modelKey)
  })

  if (foundSpecs) {
    const [, specs] = foundSpecs
    return {
      engine: specs.displacement ? `${specs.displacement}${specs.turbo ? ' Turbo' : ''}` : null,
      horsepower: specs.horsepower || null,
      torque: specs.torque || null,
      transmission: specs.transmission || null,
      fuel: specs.fuel || null,
      drive: specs.drive || null,
      displacement: specs.displacement || null,
      engineType: specs.engineType || null,
      turbo: specs.turbo || null,
      doors: specs.doors || null,
      seats: specs.seats || null,
      trunkCapacity: specs.trunkCapacity || null,
      weightKg: specs.weightKg || null,
      lengthMm: null,
      widthMm: null,
      heightMm: null,
      wheelbaseMm: null,
      topSpeed: null,
      acceleration0100: null,
      fuelEconomyCityGas: specs.fuelEconomyCityGas || null,
      fuelEconomyRoadGas: specs.fuelEconomyRoadGas || null,
      airbagsCount: specs.airbagsCount || null,
      latinNcap: specs.latinNcap || null,
      hasCarplay: specs.hasCarplay || null,
      hasAndroidAuto: specs.hasAndroidAuto || null,
      hasMultimedia: specs.hasMultimedia || null,
      hasRearCamera: specs.hasRearCamera || null,
      hasCruiseCtrl: specs.hasCruiseCtrl || null,
      hasAc: specs.hasAc || null,
      absBrakes: specs.absBrakes || null,
      esc: specs.esc || null,
      isofix: specs.isofix || null,
      bodyType: specs.category || null,
      category: specs.category || null,
    }
  }

  // Estratégia 3: Inferência inteligente por regex
  const inferred = inferSpecsFromText(vehicle.model, vehicle.version, vehicle.year)

  return {
    engine: inferred.displacement ? `${inferred.displacement}${inferred.turbo ? ' Turbo' : ''}` : null,
    horsepower: null,
    torque: null,
    transmission: inferred.transmission || null,
    fuel: inferred.fuel || null,
    drive: inferred.drive || null,
    displacement: inferred.displacement || null,
    engineType: inferred.fuel || null,
    turbo: inferred.turbo || null,
    doors: inferred.doors || null,
    seats: null,
    trunkCapacity: null,
    weightKg: null,
    lengthMm: null,
    widthMm: null,
    heightMm: null,
    wheelbaseMm: null,
    topSpeed: null,
    acceleration0100: null,
    fuelEconomyCityGas: null,
    fuelEconomyRoadGas: null,
    airbagsCount: null,
    latinNcap: null,
    hasCarplay: null,
    hasAndroidAuto: null,
    hasMultimedia: null,
    hasRearCamera: null,
    hasCruiseCtrl: null,
    hasAc: null,
    absBrakes: null,
    esc: null,
    isofix: null,
    bodyType: inferred.bodyType || null,
    category: inferred.category || null,
  }
}
