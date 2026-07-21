'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, User, CreditCard, Phone, Mail, Lock, Check, Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

interface Props {
  onAuthenticated?: () => void
  compact?: boolean
  redirectTo?: string
  defaultMode?: 'login' | 'signup'
}

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function validateCPF(cpf: string) {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10) rest = 0
  if (rest !== parseInt(digits[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10) rest = 0
  return rest === parseInt(digits[10])
}

export default function AuthCard({ onAuthenticated, compact = false, redirectTo, defaultMode = 'login' }: Props) {
  const router = useRouter()
  const supabaseReady = isSupabaseBrowserConfigured()
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode)
  const [step, setStep] = useState<1 | 2>(1)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<'pf' | 'revenda'>('pf')
  const [storeName, setStoreName] = useState('')
  const [cnpj, setCnpj] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
  const canNextStep = mode === 'signup' && step === 1 && firstName.trim().length >= 2 && lastName.trim().length >= 2 && validateCPF(cpf) && (accountType === 'pf' || storeName.trim().length >= 2)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabaseReady) {
      setError('Autenticação indisponível.')
      return
    }
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = getSupabaseBrowserClient()

      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError('E-mail ou senha incorretos.')
          return
        }

        onAuthenticated?.()
        if (redirectTo) router.push(redirectTo)
      } else {
        const cleanCpf = cpf.replace(/\D/g, '')
        const cleanPhone = phone.replace(/\D/g, '')

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              cpf: cleanCpf,
              phone: cleanPhone,
              account_type: accountType,
              store_name: storeName.trim() || undefined,
              cnpj: cnpj.replace(/\D/g, '') || undefined,
            },
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          },
        })

        if (signUpError) {
          if (signUpError.message.includes('already')) {
            setError('Este e-mail já está cadastrado.')
          } else {
            setError(signUpError.message)
          }
          return
        }

        if (data.session && data.user) {
          // Also save to users table
          await supabase.from('users').upsert({
            id: data.user.id,
            email,
            full_name: fullName,
            account_type: accountType,
            store_name: storeName.trim() || null,
            cnpj: cnpj.replace(/\D/g, '') || null,
          }, { onConflict: 'id' })
          onAuthenticated?.()
          if (redirectTo) router.push(redirectTo)
        } else {
          setMessage('Conta criada! Confirme seu e-mail para continuar.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const resetSignup = () => {
    setStep(1)
    setFirstName('')
    setLastName('')
    setCpf('')
    setPhone('')
    setEmail('')
    setPassword('')
    setAccountType('pf')
    setStoreName('')
    setCnpj('')
    setError(null)
    setMessage(null)
  }

  const switchMode = () => {
    if (mode === 'signup') {
      setMode('login')
      resetSignup()
    } else {
      setMode('signup')
      setStep(1)
      setError(null)
      setMessage(null)
    }
  }

  // ── LOGIN ──
  if (mode === 'login') {
    return (
      <div className={`surface-strong auth-card-shell ${compact ? 'p-6' : 'p-8 md:p-10'}`}>
        <div className="auth-card-topline">
          <span>Acesso rápido</span>
          <span>FIPE integrada</span>
        </div>
        <h2 className="text-[24px] md:text-[28px] font-semibold tracking-tight text-[#0A0A0A] text-balance">
          Entre na sua conta
        </h2>
        <p className="mt-2 text-[15px] text-[#52607A] tracking-tight text-pretty">
          Acesse para gerenciar seus anúncios e conversas.
        </p>

        {!supabaseReady && (
          <div className="mt-6 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl">
            <p className="text-[13px] text-[#DC2626] tracking-tight">
              Ambiente sem Supabase configurado. Login indisponível.
            </p>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="login-email" className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] pointer-events-none" strokeWidth={1.75} />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="input auth-icon-input h-12 pr-4 rounded-2xl"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] pointer-events-none" strokeWidth={1.75} />
              <input
                id="login-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="input auth-icon-input h-12 pr-4 rounded-2xl"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl">
              <p className="text-[13px] text-[#DC2626] tracking-tight">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Entrar <ArrowRight className="w-4 h-4" strokeWidth={2} /></>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#EAEAE8] text-center">
          <button type="button" onClick={switchMode} className="text-[14px] text-[#52607A] hover:text-[#0A0A0A] transition-colors">
            Não tem conta? <span className="text-[#0A0A0A] font-medium">Criar conta</span>
          </button>
        </div>

        <p className="mt-6 text-[11px] text-[#A3A3A3] tracking-tight text-center">
          Ao continuar, você concorda com nossos{' '}
          <Link href="#" className="underline underline-offset-2 hover:text-[#0A0A0A]">Termos</Link>
          {' '}e{' '}
          <Link href="#" className="underline underline-offset-2 hover:text-[#0A0A0A]">Privacidade</Link>.
        </p>
      </div>
    )
  }

  // ── SIGNUP ──
  return (
    <div className={`surface-strong auth-card-shell ${compact ? 'p-6' : 'p-8 md:p-10'}`}>
      {/* Top bar */}
      <div className="auth-card-topline">
        <span>Cadastro grátis</span>
        <span>2 passos</span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mt-4 mb-6">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-semibold transition-all duration-200 ${
          step === 1 ? 'bg-[var(--color-bg-inverse)] text-white' : 'bg-[#16855C] text-white'
        }`}>
          {step === 2 ? <Check size={16} strokeWidth={2.5} /> : '1'}
        </div>
        <div className={`h-[2px] flex-1 rounded-full transition-all duration-300 ${step === 2 ? 'bg-[#16855C]' : 'bg-[#E0E0E0]'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-semibold transition-all duration-200 ${
          step === 2 ? 'bg-[var(--color-bg-inverse)] text-white' : 'bg-[#E8E8E8] text-[#A3A3A3]'
        }`}>
          2
        </div>
      </div>

      {!supabaseReady && (
        <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl">
          <p className="text-[13px] text-[#DC2626] tracking-tight">
            Ambiente sem Supabase configurado. Cadastro indisponível.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Name + CPF */}
        {step === 1 && (
          <div className="space-y-4" style={{ animation: 'fadeIn 0.25s ease' }}>
            <h2 className="text-[22px] md:text-[26px] font-semibold tracking-tight text-[#0A0A0A] text-balance">
              Seus dados
            </h2>
            <p className="text-[14px] text-[#52607A] tracking-tight mb-2">
              Comece pelo seu nome e CPF.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="signup-firstname" className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
                  Nome
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] pointer-events-none" strokeWidth={1.75} />
                  <input
                    id="signup-firstname"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nome"
                    className="input auth-icon-input h-12 pr-4 rounded-2xl"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signup-lastname" className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
                  Sobrenome
                </label>
                <input
                  id="signup-lastname"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Sobrenome"
                  className="input h-12 px-4 rounded-2xl"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-cpf" className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
                CPF
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] pointer-events-none" strokeWidth={1.75} />
                <input
                  id="signup-cpf"
                  type="text"
                  inputMode="numeric"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="input auth-icon-input h-12 pr-4 rounded-2xl"
                  maxLength={14}
                />
              </div>
              {cpf.length === 14 && !validateCPF(cpf) && (
                <p className="mt-1 text-[12px] text-[#DC2626]">CPF inválido</p>
              )}
            </div>

            {/* Account Type Toggle */}
            <div>
              <label className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
                Tipo de conta
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType('pf')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-[13px] font-semibold border transition-all ${
                    accountType === 'pf'
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                      : 'bg-white text-[#525252] border-[#E0E0E0] hover:border-[#A3A3A3]'
                  }`}
                >
                  Pessoa Física
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('revenda')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-[13px] font-semibold border transition-all ${
                    accountType === 'revenda'
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                      : 'bg-white text-[#525252] border-[#E0E0E0] hover:border-[#A3A3A3]'
                  }`}
                >
                  Revenda
                </button>
              </div>
            </div>

            {/* Revenda Fields */}
            {accountType === 'revenda' && (
              <div className="space-y-4" style={{ animation: 'fadeIn 0.2s ease' }}>
                <div>
                  <label htmlFor="signup-store-name" className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
                    Nome da loja
                  </label>
                  <input
                    id="signup-store-name"
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ex: Auto Carros"
                    className="input h-12 pr-4 rounded-2xl"
                  />
                </div>
                <div>
                  <label htmlFor="signup-cnpj" className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
                    CNPJ <span className="text-[#A3A3A3]">(opcional)</span>
                  </label>
                  <input
                    id="signup-cnpj"
                    type="text"
                    inputMode="numeric"
                    value={cnpj}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 14)
                      if (v.length > 12) v = v.slice(0,2) + '.' + v.slice(2,5) + '.' + v.slice(5,8) + '/' + v.slice(8,12) + '-' + v.slice(12)
                      else if (v.length > 8) v = v.slice(0,2) + '.' + v.slice(2,5) + '.' + v.slice(5,8) + '/' + v.slice(8)
                      else if (v.length > 5) v = v.slice(0,2) + '.' + v.slice(2,5) + '.' + v.slice(5)
                      else if (v.length > 2) v = v.slice(0,2) + '.' + v.slice(2)
                      setCnpj(v)
                    }}
                    placeholder="00.000.000/0000-00"
                    className="input h-12 pr-4 rounded-2xl"
                    maxLength={18}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl">
                <p className="text-[13px] text-[#DC2626] tracking-tight">{error}</p>
              </div>
            )}

            <button
              type="button"
              disabled={!canNextStep}
              onClick={() => { setError(null); setStep(2) }}
              className="btn btn-primary btn-lg w-full mt-2"
            >
              Continuar <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Step 2: Phone + Email + Password */}
        {step === 2 && (
          <div className="space-y-4" style={{ animation: 'fadeIn 0.25s ease' }}>
            <div className="flex items-center gap-3 mb-1">
              <button type="button" onClick={() => setStep(1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F0F0F0] hover:bg-[#E4E4E4] transition-colors">
                <ArrowLeft size={16} strokeWidth={2} className="text-[#525252]" />
              </button>
              <div>
                <h2 className="text-[22px] md:text-[26px] font-semibold tracking-tight text-[#0A0A0A]">
                  Contato e acesso
                </h2>
              </div>
            </div>
            <p className="text-[14px] text-[#52607A] tracking-tight">
              Como podemos falar com você e qual e-mail para login?
            </p>

            <div>
              <label htmlFor="signup-phone" className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] pointer-events-none" strokeWidth={1.75} />
                <input
                  id="signup-phone"
                  type="tel"
                  inputMode="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="input auth-icon-input h-12 pr-4 rounded-2xl"
                  maxLength={15}
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] pointer-events-none" strokeWidth={1.75} />
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="input auth-icon-input h-12 pr-4 rounded-2xl"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] pointer-events-none" strokeWidth={1.75} />
                <input
                  id="signup-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="input auth-icon-input h-12 pr-4 rounded-2xl"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl">
                <p className="text-[13px] text-[#DC2626] tracking-tight">{error}</p>
              </div>
            )}
            {message && (
              <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl">
                <p className="text-[13px] text-[#10B981] tracking-tight">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password || password.length < 6}
              className="btn btn-primary btn-lg w-full mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Criar conta <ArrowRight className="w-4 h-4" strokeWidth={2} /></>
              )}
            </button>
          </div>
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-[#EAEAE8] text-center">
        <button type="button" onClick={switchMode} className="text-[14px] text-[#52607A] hover:text-[#0A0A0A] transition-colors">
          Já tem conta? <span className="text-[#0A0A0A] font-medium">Entrar</span>
        </button>
      </div>

      <p className="mt-6 text-[11px] text-[#A3A3A3] tracking-tight text-center">
        Ao continuar, você concorda com nossos{' '}
        <Link href="#" className="underline underline-offset-2 hover:text-[#0A0A0A]">Termos</Link>
        {' '}e{' '}
        <Link href="#" className="underline underline-offset-2 hover:text-[#0A0A0A]">Privacidade</Link>.
      </p>
    </div>
  )
}
