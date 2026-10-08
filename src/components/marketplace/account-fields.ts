/* Dados de conta pedidos na etapa final de publicação.
   Compartilhado entre o fluxo de carro e o de caminhão. */

export const ACCOUNT_INITIAL = { name: '', phone: '', cpf: '', email: '', password: '', confirmPassword: '' }

export type AccountForm = typeof ACCOUNT_INITIAL
export type AccountField = keyof AccountForm
export type AccountErrors = Partial<Record<AccountField, string>>

export const ACCOUNT_INPUT_IDS: Record<AccountField, string> = {
  name: 'account-name',
  phone: 'account-phone',
  cpf: 'account-cpf',
  email: 'account-email',
  password: 'account-password',
  confirmPassword: 'account-confirm',
}

export function formatCPF(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d.length <= 10
    ? d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export function isValidCPF(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i)
  let r = (s * 10) % 11
  if (r === 10) r = 0
  if (r !== parseInt(d[9])) return false
  s = 0
  for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i)
  r = (s * 10) % 11
  if (r === 10) r = 0
  return r === parseInt(d[10])
}

export function getAccountErrors(account: AccountForm): Array<{ key: AccountField; message: string }> {
  const errors: Array<{ key: AccountField; message: string }> = []
  if (account.name.trim().length < 3) errors.push({ key: 'name', message: 'Informe seu nome completo.' })
  if (account.phone.replace(/\D/g, '').length < 10) errors.push({ key: 'phone', message: 'Informe um telefone válido.' })
  if (!isValidCPF(account.cpf)) errors.push({ key: 'cpf', message: 'Informe um CPF válido.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email.trim())) errors.push({ key: 'email', message: 'Informe um e-mail válido.' })
  if (
    account.password.length < 8 ||
    !/[A-Z]/.test(account.password) ||
    !/\d/.test(account.password) ||
    !/[^A-Za-z0-9]/.test(account.password)
  ) errors.push({ key: 'password', message: 'A senha deve ter 8+ caracteres, com letra maiúscula, número e símbolo.' })
  if (account.password !== account.confirmPassword) errors.push({ key: 'confirmPassword', message: 'As senhas não coincidem.' })
  return errors
}
