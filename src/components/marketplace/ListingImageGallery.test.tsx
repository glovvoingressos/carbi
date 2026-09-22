// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import ListingImageGallery from './ListingImageGallery'

describe('ListingImageGallery', () => {
  afterEach(() => {
    cleanup()
  })

  it('opens the current image in an accessible lightbox and closes with Escape', () => {
    render(<ListingImageGallery images={['/car-front.jpg', '/car-back.jpg']} title="Chev Tracker LT" />)

    fireEvent.click(screen.getByRole('button', { name: 'Ampliar imagem 1' }))

    expect(screen.getByRole('dialog', { name: 'Imagem ampliada de Chev Tracker LT' })).toBeTruthy()
    const closeButton = screen.getByRole('button', { name: 'Fechar imagem ampliada' })
    expect(closeButton).toBeTruthy()
    expect(document.activeElement).toBe(closeButton)
    fireEvent.click(screen.getByRole('button', { name: 'Próxima imagem' }))

    expect(screen.getByRole('dialog', { name: 'Imagem ampliada de Chev Tracker LT' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ampliar imagem 2' })).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: 'Imagem ampliada de Chev Tracker LT' })).toBeNull()
  })
})
