// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import PlateBannerLookup from './PlateBannerLookup'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('PlateBannerLookup', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows the rounded-card image before the unchanged plate lookup content', () => {
    render(<PlateBannerLookup />)

    const image = screen.getByRole('img', { name: 'Picape em uma estrada no deserto' })
    const heading = screen.getByRole('heading', { name: 'Anuncie seu carro em menos de 2 minutos.' })

    expect(image.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Placa do veículo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Consultar' })).toBeTruthy()
  })
})
