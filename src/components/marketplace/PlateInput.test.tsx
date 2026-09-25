// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import PlateInput from './PlateInput'

describe('PlateInput', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the plate privacy notice at 12px', () => {
    render(<PlateInput onPlateFound={vi.fn()} />)

    const notice = screen.getByText(/A placa é usada apenas para preencher os dados do veículo/)

    expect(getComputedStyle(notice).fontSize).toBe('12px')
  })
})
