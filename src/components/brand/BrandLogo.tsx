'use client'

import React, { useState } from 'react'

interface BrandLogoProps {
  brandName: string
  domain: string
  className?: string
}

const LOGO_MAP: Record<string, string> = {
  // Nacionais / com produção local
  toyota: 'https://www.carlogos.org/car-logos/toyota-logo.png',
  honda: 'https://www.carlogos.org/car-logos/honda-logo.png',
  fiat: 'https://www.carlogos.org/car-logos/fiat-logo.png',
  volkswagen: 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
  vw: 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
  chevrolet: 'https://www.carlogos.org/car-logos/chevrolet-logo.png',
  ford: 'https://www.carlogos.org/car-logos/ford-logo.png',
  hyundai: 'https://www.carlogos.org/car-logos/hyundai-logo.png',
  jeep: 'https://www.carlogos.org/car-logos/jeep-logo.png',
  nissan: 'https://www.carlogos.org/car-logos/nissan-logo.png',
  peugeot: 'https://www.carlogos.org/car-logos/peugeot-logo.png',
  renault: 'https://www.carlogos.org/car-logos/renault-logo.png',
  citroen: 'https://www.carlogos.org/car-logos/citroen-logo.png',
  citroën: 'https://www.carlogos.org/car-logos/citroen-logo.png',
  mitsubishi: 'https://www.carlogos.org/car-logos/mitsubishi-logo.png',
  suzuki: 'https://www.carlogos.org/car-logos/suzuki-logo.png',
  ram: 'https://www.carlogos.org/car-logos/ram-logo.png',
  agrale: 'https://www.carlogos.org/car-logos/agrale-logo.png',
  iveco: 'https://www.carlogos.org/car-logos/iveco-logo.png',

  // Chinesas
  byd: 'https://www.carlogos.org/car-logos/byd-logo.png',
  'caoa chery': 'https://www.carlogos.org/car-logos/chery-logo.png',
  'caoa-chery': 'https://www.carlogos.org/car-logos/chery-logo.png',
  chery: 'https://www.carlogos.org/car-logos/chery-logo.png',
  gwm: 'https://www.carlogos.org/logo/Great-Wall-logo.png',
  haval: 'https://www.carlogos.org/car-logos/haval-logo.png',
  jac: 'https://www.carlogos.org/car-logos/jac-logo.png',
  omoda: 'https://www.carlogos.org/car-logos/omoda-logo.png',
  jaecoo: 'https://www.carlogos.org/car-logos/jaecoo-logo.png',
  changan: 'https://www.carlogos.org/car-logos/changan-logo.png',
  dongfeng: 'https://www.carlogos.org/car-logos/dongfeng-logo.png',
  exeed: 'https://www.carlogos.org/car-logos/exeed-logo.png',
  foton: 'https://www.carlogos.org/car-logos/foton-logo.png',
  lifan: 'https://www.carlogos.org/car-logos/lifan-logo.png',

  // Premium
  bmw: 'https://www.carlogos.org/car-logos/bmw-logo.png',
  audi: 'https://www.carlogos.org/car-logos/audi-logo.png',
  mercedes: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
  'mercedes-benz': 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
  volvo: 'https://www.carlogos.org/car-logos/volvo-logo.png',
  'land-rover': 'https://www.carlogos.org/car-logos/land-rover-logo.png',
  'land rover': 'https://www.carlogos.org/car-logos/land-rover-logo.png',
  jaguar: 'https://www.carlogos.org/car-logos/jaguar-logo.png',
  subaru: 'https://www.carlogos.org/car-logos/subaru-logo.png',
  mini: 'https://www.carlogos.org/car-logos/mini-logo.png',
  'alfa-romeo': 'https://www.carlogos.org/car-logos/alfa-romeo-logo.png',
  'alfa romeo': 'https://www.carlogos.org/car-logos/alfa-romeo-logo.png',
  kia: 'https://www.carlogos.org/car-logos/kia-logo.png',
  genesis: 'https://www.carlogos.org/car-logos/genesis-logo.png',

  // Luxo
  porsche: 'https://www.carlogos.org/car-logos/porsche-logo.png',
  lexus: 'https://www.carlogos.org/car-logos/lexus-logo.png',
  ferrari: 'https://www.carlogos.org/car-logos/ferrari-logo.png',
  lamborghini: 'https://www.carlogos.org/car-logos/lamborghini-logo.png',
  maserati: 'https://www.carlogos.org/car-logos/maserati-logo.png',
  mclaren: 'https://www.carlogos.org/car-logos/mclaren-logo.png',
  'aston-martin': 'https://www.carlogos.org/car-logos/aston-martin-logo.png',
  'rolls-royce': 'https://www.carlogos.org/car-logos/rolls-royce-logo.png',
  bentley: 'https://www.carlogos.org/car-logos/bentley-logo.png',
  bugatti: 'https://www.carlogos.org/car-logos/bugatti-logo.png',

  // Elétricas
  tesla: 'https://www.carlogos.org/car-logos/tesla-logo.png',

  // Importadas / outras
  dodge: 'https://www.carlogos.org/car-logos/dodge-logo.png',
  chrysler: 'https://www.carlogos.org/car-logos/chrysler-logo.png',
  smart: 'https://www.carlogos.org/car-logos/smart-logo.png',
  mazda: 'https://www.carlogos.org/car-logos/mazda-logo.png',
}

export default function BrandLogo({ brandName, domain, className }: BrandLogoProps) {
  const [error, setError] = useState(false)

  const normalizedName = brandName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const imageSrc = LOGO_MAP[normalizedName] || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!error ? (
        <img 
          src={imageSrc} 
          alt={brandName} 
          className={className}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-[#FAFAF9] rounded-2xl">
           <span className="font-semibold text-[18px] text-[#0A0A0A] uppercase tracking-tight">
            {brandName.charAt(0)}
          </span>
        </div>
      )}
    </div>
  )
}
