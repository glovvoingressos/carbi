// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ListingStepper from './ListingStepper'

describe('ListingStepper', () => {
  it('marks completed steps and only allows returning to previous steps', () => {
    const onStepChange = vi.fn()

    render(<ListingStepper currentStep={2} onStepChange={onStepChange} />)

    expect(screen.getByRole('navigation', { name: 'Progresso do anúncio' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Voltar para Veículo' }).hasAttribute('disabled')).toBe(false)
    expect(screen.getByRole('button', { name: 'Ir para Revisão' }).hasAttribute('disabled')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Voltar para Veículo' }))

    expect(onStepChange).toHaveBeenCalledWith(1)
  })
})
