import { describe, expect, it } from 'vitest'

import { ACCOUNT_INITIAL, formatCPF, formatPhone, getAccountErrors, isValidCPF } from './account-fields'

const valid = {
  name: 'Maria Silva',
  phone: '(11) 98888-7777',
  cpf: '529.982.247-25',
  email: 'maria@email.com',
  password: 'Senha@123',
  confirmPassword: 'Senha@123',
}

describe('account-fields', () => {
  it('aceita uma conta completa e válida', () => {
    expect(getAccountErrors(valid)).toEqual([])
  })

  it('aponta o primeiro campo inválido com mensagem', () => {
    const errors = getAccountErrors(ACCOUNT_INITIAL)
    expect(errors[0].key).toBe('name')
    expect(errors.map((error) => error.key)).toEqual(['name', 'phone', 'cpf', 'email', 'password'])
  })

  it('exige senhas iguais', () => {
    const errors = getAccountErrors({ ...valid, confirmPassword: 'Senha@124' })
    expect(errors).toEqual([{ key: 'confirmPassword', message: 'As senhas não coincidem.' }])
  })

  it('valida CPF pelo dígito verificador', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true)
    expect(isValidCPF('529.982.247-26')).toBe(false)
    expect(isValidCPF('111.111.111-11')).toBe(false)
    expect(isValidCPF('123')).toBe(false)
  })

  it('formata CPF e telefone enquanto digita', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25')
    expect(formatPhone('11988887777')).toBe('(11) 98888-7777')
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
  })
})
