import { CarSpec } from './types'
import { cars } from './catalog'

export const formatBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export const getCarScoreByProfile = (car: CarSpec, profileId: string): number => {
  let score = 50 // Base score

  // Price factor (lower price is generally better for 'economico')
  if (profileId === 'economico') {
    if (car.priceBrl < 80000) score += 30
    else if (car.priceBrl < 120000) score += 15
    if (car.tags.includes('eficiente')) score += 20
  }

  if (profileId === 'familia') {
    if (car.seats >= 5) score += 15
    if (car.trunkCapacity >= 400) score += 15
    if (car.segment === 'suv' || car.segment === 'sedan') score += 15
  }

  if (profileId === 'seguranca') {
    if (car.airbagsCount >= 6) score += 20
    if (car.latinNcap && car.latinNcap >= 4) score += 20
    if (car.absBrakes && car.esc) score += 10
  }

  if (profileId === 'tecnologia') {
    if (car.hasCarplay || car.hasAndroidAuto) score += 15
    if (car.hasMultimedia) score += 15
    if (car.tags.includes('tecnologia')) score += 20
  }

  if (profileId === 'potencia') {
    if (car.horsepower >= 150) score += 20
    if (car.turbo) score += 15
    if (car.acceleration0100 && car.acceleration0100 < 9) score += 15
  }

  if (profileId === 'custo-beneficio') {
    if (car.priceBrl < 130000 && (car.hasCarplay || car.hasMultimedia)) score += 20
    if (car.isPopular) score += 20
  }

  return Math.min(100, score)
}

export const matchCarToProfile = (profile: any, profileId?: string) => {
  if (typeof profile === 'object' && !profileId) {
    // Legacy support for profile object search
    return cars
      .filter(car => car.priceBrl <= profile.budget * 1.1)
      .sort((a, b) => {
        const scoreA = getCarScoreByProfile(a, profile.priorities[0] || 'custo-beneficio')
        const scoreB = getCarScoreByProfile(b, profile.priorities[0] || 'custo-beneficio')
        return scoreB - scoreA
      })
      .slice(0, 3)
  }
  
  // Scoring mode: matchCarToProfile(car, profileId)
  return getCarScoreByProfile(profile as CarSpec, profileId || 'custo-beneficio')
}

export const getCarsBySegment = (segment: string) => {
  return cars.filter(car => car.segment.toLowerCase() === segment.toLowerCase())
}

export const getCarsByBrand = (brand: string) => {
  return cars.filter(car => car.brand.toLowerCase() === brand.toLowerCase())
}

export const getCarBySlug = (slug: string) => {
  return cars.find(car => car.slug === slug)
}

export const priceRanges = [
  { id: 'ate-80', label: 'Até R$ 80k', min: 0, max: 80000 },
  { id: '80-120', label: 'R$ 80k - R$ 120k', min: 80000, max: 120000 },
  { id: '120-180', label: 'R$ 120k - R$ 180k', min: 120000, max: 180000 },
  { id: '180-300', label: 'R$ 180k - R$ 300k', min: 180000, max: 300000 },
  { id: '300-plus', label: 'Acima de R$ 300k', min: 300000, max: Infinity },
]

export const profiles = [
  { id: 'economico', label: 'Econômico', icon: 'Leaf' },
  { id: 'familia', label: 'Família', icon: 'Users' },
  { id: 'seguranca', label: 'Segurança', icon: 'Shield' },
  { id: 'tecnologia', label: 'Tecnologia', icon: 'Cpu' },
  { id: 'potencia', label: 'Potência', icon: 'Zap' },
  { id: 'custo-beneficio', label: 'Custo-benefício', icon: 'DollarSign' },
]

export const compareCars = (selectedIds: string[]) => {
  const selectedCars = cars.filter((c: CarSpec) => selectedIds.includes(c.id));
  const winners: Record<string, string> = {};
  
  const fields = [
    { key: 'priceBrl', lower: true },
    { key: 'horsepower', lower: false },
    { key: 'torque', lower: false },
    { key: 'fuelEconomyCityGas', lower: false },
    { key: 'acceleration0100', lower: true },
    { key: 'trunkCapacity', lower: false },
    { key: 'airbagsCount', lower: false },
    { key: 'latinNcap', lower: false },
  ];

  fields.forEach(field => {
    let bestCar = selectedCars[0];
    selectedCars.forEach((car: CarSpec) => {
      const currentVal = car[field.key as keyof CarSpec] as number;
      const bestVal = bestCar[field.key as keyof CarSpec] as number;
      
      if (field.lower) {
        if (currentVal < bestVal) bestCar = car;
      } else {
        if (currentVal > bestVal) bestCar = car;
      }
    });
    winners[field.key] = bestCar.id;
  });

  return {
    cars: selectedCars,
    winners
  };
}
