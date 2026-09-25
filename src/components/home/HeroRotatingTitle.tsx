'use client'

import { useEffect, useState } from 'react'
import { TextScramble } from '@/components/core/text-scramble'

const HERO_ACTIONS = ['Encontre', 'Venda', 'Compre', 'Pesquise']
const ROTATION_INTERVAL_MS = 2800

export default function HeroRotatingTitle() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mediaQuery) return

    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches)
    updateMotionPreference()
    mediaQuery.addEventListener?.('change', updateMotionPreference)

    return () => mediaQuery.removeEventListener?.('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % HERO_ACTIONS.length)
    }, ROTATION_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [prefersReducedMotion])

  const activeWord = HERO_ACTIONS[activeIndex]

  return (
    <h1 className="cb-hero-title">
      <span className="cb-hero-title-word-slot" aria-live="polite" aria-atomic="true">
        <TextScramble data-testid="hero-rotating-word" className="cb-hero-title-word" duration={620}>
          {activeWord}
        </TextScramble>
      </span>{' '}
      o carro <u>certo</u>, sem complicação.
    </h1>
  )
}
