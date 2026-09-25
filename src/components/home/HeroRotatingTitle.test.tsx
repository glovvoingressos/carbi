// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import HeroRotatingTitle from './HeroRotatingTitle'

describe('HeroRotatingTitle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('rotates through the buying and selling actions in order', () => {
    render(<HeroRotatingTitle />)

    expect(screen.getByRole('heading').textContent?.replace(/\s+/g, ' ').trim())
      .toBe('Encontre o carro certo, sem complicação.')
    expect(screen.getByTestId('hero-rotating-word').textContent).toBe('Encontre')

    act(() => vi.advanceTimersByTime(2800))
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByTestId('hero-rotating-word').textContent).toBe('Venda')

    act(() => vi.advanceTimersByTime(2800))
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByTestId('hero-rotating-word').textContent).toBe('Compre')

    act(() => vi.advanceTimersByTime(2800))
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByTestId('hero-rotating-word').textContent).toBe('Pesquise')
  })
})
