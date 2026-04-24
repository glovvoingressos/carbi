'use client'

import React, { useState } from 'react'

interface BrandLogoProps {
  brandName: string
  domain: string
  className?: string
}

const LOGO_MAP: Record<string, string> = {
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
  byd: 'https://www.carlogos.org/car-logos/byd-logo.png',
  bmw: 'https://www.carlogos.org/car-logos/bmw-logo.png',
  audi: 'https://www.carlogos.org/car-logos/audi-logo.png',
  porsche: 'https://www.carlogos.org/car-logos/porsche-logo.png',
  citroen: 'https://www.carlogos.org/car-logos/citroen-logo.png',
  citroën: 'https://www.carlogos.org/car-logos/citroen-logo.png',
  mini: 'https://www.carlogos.org/car-logos/mini-logo.png',
  ram: 'https://www.carlogos.org/car-logos/ram-logo.png',
  'caoa chery': 'https://www.carlogos.org/car-logos/chery-logo.png',
  'caoa-chery': 'https://www.carlogos.org/car-logos/chery-logo.png',
  gwm: 'https://www.carlogos.org/logo/Great-Wall-logo.png',
  mitsubishi: 'https://www.carlogos.org/car-logos/mitsubishi-logo.png',
  volvo: 'https://www.carlogos.org/car-logos/volvo-logo.png',
  'land-rover': 'https://www.carlogos.org/car-logos/land-rover-logo.png',
  'land rover': 'https://www.carlogos.org/car-logos/land-rover-logo.png',
  mercedes: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
  'mercedes-benz': 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png'
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
        <div className="flex items-center justify-center w-full h-full bg-white rounded-lg shadow-inner">
           <span className="font-black text-xl text-dark uppercase tracking-tighter opacity-80 scale-110">
            {brandName.charAt(0)}
          </span>
        </div>
      )}
    </div>
  )
}
