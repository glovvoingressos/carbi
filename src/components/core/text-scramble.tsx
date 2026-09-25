'use client'

import { useEffect, useRef, useState, type HTMLAttributes } from 'react'

const SCRAMBLE_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const FRAME_INTERVAL_MS = 32

type TextScrambleProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  children: string
  duration?: number
}

function randomCharacter() {
  return SCRAMBLE_CHARACTERS[Math.floor(Math.random() * SCRAMBLE_CHARACTERS.length)]
}

function createScrambledFrame(source: string, target: string, progress: number) {
  const length = Math.max(source.length, target.length)
  const revealedCharacters = Math.floor(length * progress)

  return Array.from({ length }, (_, index) => {
    const targetCharacter = target[index] ?? ''
    if (index < revealedCharacters) return targetCharacter
    if (targetCharacter === ' ') return ' '
    return randomCharacter()
  }).join('')
}

export function TextScramble({ children, className, duration = 620, ...props }: TextScrambleProps) {
  const [displayedText, setDisplayedText] = useState(children)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const previousText = useRef(children)

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mediaQuery) return

    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches)
    updateMotionPreference()
    mediaQuery.addEventListener?.('change', updateMotionPreference)

    return () => mediaQuery.removeEventListener?.('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    const source = previousText.current
    previousText.current = children

    if (source === children || prefersReducedMotion) {
      setDisplayedText(children)
      return
    }

    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration)
      setDisplayedText(createScrambledFrame(source, children, progress))

      if (progress >= 1) {
        window.clearInterval(timer)
      }
    }, FRAME_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [children, duration, prefersReducedMotion])

  return (
    <span {...props} className={className} aria-live="polite" aria-atomic="true">
      {displayedText}
    </span>
  )
}
