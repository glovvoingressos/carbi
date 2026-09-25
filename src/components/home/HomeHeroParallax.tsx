'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

export default function HomeHeroParallax() {
  const backgroundRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: backgroundRef,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-7%', '7%'])

  return (
    <div
      ref={backgroundRef}
      className="cb-hero-parallax"
      role="presentation"
      aria-hidden="true"
    >
      <motion.div
        className="cb-hero-parallax__image"
        style={{ y: reduceMotion ? 0 : y }}
      >
        <img src="/images/carbi-home-hero-grain.webp" alt="" fetchPriority="high" />
      </motion.div>
    </div>
  )
}
