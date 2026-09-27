'use client'

import { useEffect, useRef, useState, type HTMLAttributes } from 'react'

type TextScrambleProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  children: string
  duration?: number
}

export function TextScramble({ children, className, duration = 620, ...props }: TextScrambleProps) {
  const [displayedText, setDisplayedText] = useState(children)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
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
      setIsTransitioning(false)
      return
    }

    // Keep the word readable during the transition. Random placeholder
    // characters can be captured by assistive technology and by users on a
    // slow frame, so the effect is intentionally deterministic.
    setDisplayedText(children)
    setIsTransitioning(true)
    const timer = window.setTimeout(() => setIsTransitioning(false), duration)

    return () => window.clearTimeout(timer)
  }, [children, duration, prefersReducedMotion])

  return (
    <span
      {...props}
      className={className}
      style={{
        ...props.style,
        opacity: isTransitioning ? 0.72 : 1,
        transform: isTransitioning ? 'translateY(0.04em)' : 'translateY(0)',
        transition: prefersReducedMotion ? 'none' : `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
      }}
    >
      {displayedText}
    </span>
  )
}
