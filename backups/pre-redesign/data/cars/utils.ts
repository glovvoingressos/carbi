import { CarSpec } from './types'
import { cars } from './catalog'

export const formatBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export const matchCarToProfile = (profile: {
  budget: number,
  useCase: string,
  familySize: number,
  priorities: string[]
}) => {
  return cars
    .filter(car => car.priceBrl <= profile.budget * 1.1) // 10% tolerance
    .sort((a, b) => {
      let scoreA = 0
      let scoreB = 0

      // Match family size
      if (profile.familySize > 4 && a.seats >= 5) scoreA += 2
      if (profile.familySize > 4 && b.seats >= 5) scoreB += 2

      // Match use case topics
      if (profile.useCase === 'trabalho' && a.segment === 'pickup') scoreA += 5
      if (profile.useCase === 'trabalho' && b.segment === 'pickup') scoreB += 5
      
      if (profile.useCase === 'familia' && a.segment === 'suv') scoreA += 5
      if (profile.useCase === 'familia' && b.segment === 'suv') scoreB += 5

      // Match tags
      profile.priorities.forEach(p => {
        if (a.tags.includes(p.toLowerCase())) scoreA += 3
        if (b.tags.includes(p.toLowerCase())) scoreB += 3
      })

      return scoreB - scoreA
    })
    .slice(0, 3)
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
  { label: 'Até R$ 80k', min: 0, max: 80000 },
  { label: 'R$ 80k - R$ 120k', min: 80000, max: 120000 },
  { label: 'R$ 120k - R$ 180k', min: 120000, max: 180000 },
  { label: 'R$ 180k - R$ 300k', min: 180000, max: 300000 },
  { label: 'Acima de R$ 300k', min: 300000, max: Infinity },
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
