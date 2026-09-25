// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import RotatingHeroWord from './RotatingHeroWord'

afterEach(cleanup)

describe('RotatingHeroWord', () => {
  it('reserves the longest word and hides animated duplicates from assistive technology', () => {
    const { container } = render(<RotatingHeroWord />)
    const rotator = container.querySelector('[data-hero-verb-rotator]')
    const words = [...(rotator?.querySelectorAll('[data-hero-verb-word]') ?? [])]

    expect(rotator?.getAttribute('aria-hidden')).toBe('true')
    expect(rotator?.querySelector('span')?.textContent).toBe('Pesquise')
    expect(words.map((word) => word.textContent)).toEqual([
      'Encontre',
      'Compre',
      'Venda',
      'Pesquise',
    ])
  })
})
