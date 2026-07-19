'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'

interface KineticTextProps {
  texts: string[]
  interval?: number
  className?: string
}

export default function KineticText({ texts, interval = 3000, className = '' }: KineticTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<'build' | 'hold' | 'exit'>('build')
  const shouldReduceMotion = useReducedMotion()

  const currentText = texts[currentIndex]
  const words = currentText.split(' ')

  const nextText = useCallback(() => {
    setPhase('exit')
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length)
      setPhase('build')
    }, shouldReduceMotion ? 100 : 400)
  }, [texts.length, shouldReduceMotion])

  useEffect(() => {
    const timer = setInterval(nextText, interval)
    return () => clearInterval(timer)
  }, [nextText, interval])

  if (shouldReduceMotion) {
    return (
      <span className={className} aria-live="polite">
        {currentText}
      </span>
    )
  }

  return (
    <span className={className} aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          className="kinetic-container"
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.3em' }}
        >
          {words.map((word, i) => (
            <motion.span
              key={`${currentIndex}-${i}`}
              className="kinetic-word"
              variants={{
                hidden: {
                  opacity: 0,
                  x: 40,
                  filter: 'blur(8px)',
                },
                visible: {
                  opacity: 1,
                  x: 0,
                  filter: 'blur(0px)',
                  transition: {
                    duration: 0.5,
                    delay: i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  },
                },
                exit: {
                  opacity: 0,
                  x: -20,
                  filter: 'blur(4px)',
                  transition: {
                    duration: 0.3,
                    delay: i * 0.04,
                    ease: [0.4, 0, 1, 1],
                  },
                },
              }}
              style={{ display: 'inline-block' }}
            >
              {word}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
