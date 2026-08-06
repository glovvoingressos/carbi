'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnunciarCarroPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/anunciar-carro/fluxo')
  }, [router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'var(--color-text-secondary)' }}>Verificando autenticação...</p>
    </div>
  )
}
