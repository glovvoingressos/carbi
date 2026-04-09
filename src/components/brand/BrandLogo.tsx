'use client'

import React, { useState } from 'react'

interface BrandLogoProps {
  brandName: string
  domain: string
  className?: string
}

export default function BrandLogo({ brandName, domain, className }: BrandLogoProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <span className="font-black text-xl text-dark">
        {brandName.charAt(0)}
      </span>
    )
  }

  return (
    <img 
      src={`https://logo.clearbit.com/${domain}`} 
      alt={brandName} 
      className={className}
      onError={() => setError(true)}
    />
  )
}
