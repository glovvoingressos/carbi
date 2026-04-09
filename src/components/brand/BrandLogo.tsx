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
  gwm: 'https://www.carlogos.org/logo/Great-Wall-logo.png'
}

export default function BrandLogo({ brandName, domain, className }: BrandLogoProps) {
  const [error, setError] = useState(false)

  // 1. Check known high-res carlogos directory
  // 2. If not in the map, try Google's global favicon service for the domain
  const normalizedName = brandName.toLowerCase().trim()
  const imageSrc = LOGO_MAP[normalizedName] || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

  if (error) {
    return (
      <span className="font-black text-xl text-dark uppercase tracking-tight">
        {brandName.charAt(0)}
      </span>
    )
  }

  return (
    <img 
      src={imageSrc} 
      alt={brandName} 
      className={className}
      onError={() => setError(true)}
    />
  )
}
