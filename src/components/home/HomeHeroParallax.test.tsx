// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import HomeHeroParallax from './HomeHeroParallax'

afterEach(cleanup)

describe('HomeHeroParallax', () => {
  it('renders the hero artwork as a decorative, full-section background', () => {
    const { container } = render(<HomeHeroParallax />)

    const background = container.querySelector('.cb-hero-parallax')
    const image = background?.querySelector('img')

    expect(background?.getAttribute('aria-hidden')).toBe('true')
    expect(image?.getAttribute('src')).toBe('/images/carbi-home-hero-grain.webp')
    expect(image?.getAttribute('alt')).toBe('')
  })
})
