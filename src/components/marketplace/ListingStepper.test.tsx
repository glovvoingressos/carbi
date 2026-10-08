// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ListingStepper from './ListingStepper'

afterEach(cleanup)

/** Quantidade de etapas visíveis no stepper. */
function stepCount(): number {
  return screen.getByRole('navigation', { name: 'Progresso do anúncio' }).querySelectorAll('li').length
}

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

  it('keeps three steps by default', () => {
    render(<ListingStepper currentStep={1} onStepChange={vi.fn()} />)

    expect(stepCount()).toBe(3)
    expect(screen.queryByRole('button', { name: /Conta/ })).toBeNull()
  })

  it('adds the account step only when showAccountStep is set', () => {
    render(<ListingStepper currentStep={4} onStepChange={vi.fn()} showAccountStep />)

    expect(stepCount()).toBe(4)
    expect(screen.getByRole('button', { name: 'Etapa atual: Conta' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Etapa atual: Conta' }).hasAttribute('aria-current')).toBe(true)
    // A etapa anterior continua acessível para voltar.
    expect(screen.getByRole('button', { name: 'Voltar para Revisão' }).hasAttribute('disabled')).toBe(false)
  })
})
