'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight,
  Loader2, Check, AlertCircle, CreditCard,
} from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

interface Props {
  onAuthenticated?: () => void
  redirectTo?: string
  defaultMode?: 'login' | 'signup'
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.length <= 10
    ? d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

function validateCPF(cpf: string) {
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

type Mode = 'login' | 'signup' | 'forgot'

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.2 } }

function InputField({ icon: Icon, id, label, type = 'text', value, onChange, placeholder, maxLength, inputMode, required, error }: {
  icon: React.ElementType; id: string; label: string; type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; maxLength?: number; inputMode?: string; required?: boolean; error?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" strokeWidth={1.75} />
        <input
          id={id} type={isPassword && show ? 'text' : type} value={value} required={required}
          onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
          inputMode={inputMode as any}
          className={`w-full h-11 pl-10 pr-10 rounded-xl border bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] ${error ? 'border-red-400' : 'border-gray-200'}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)}
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[var(--color-danger)] flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
    </div>
  )
}

function PasswordChecklist({ password }: { password: string }) {
  const rules = [
    { label: 'Pelo menos 8 caracteres', met: password.length >= 8 },
    { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Pelo menos 1 número', met: /\d/.test(password) },
    { label: 'Pelo menos 1 caractere especial', met: /[^A-Za-z0-9]/.test(password) },
  ]
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
      {rules.map((r) => (
        <div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.met ? 'text-emerald-600' : 'text-gray-400'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${r.met ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100'}`}>
            {r.met ? <Check size={10} strokeWidth={3} /> : '○'}
          </div>
          {r.label}
        </div>
      ))}
    </div>
  )
}

export default function AuthCard({ onAuthenticated, redirectTo, defaultMode = 'login' }: Props) {
  const router = useRouter()
  const supabaseReady = isSupabaseBrowserConfigured()
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [step, setStep] = useState<1 | 2>(1)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
  const step1Valid = firstName.trim().length >= 2 && lastName.trim().length >= 2 && validateCPF(cpf)
  const passwordValid = password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const reset = () => {
    setStep(1); setFirstName(''); setLastName(''); setCpf(''); setPhone(''); setEmail('')
    setPassword(''); setConfirmPassword('')
    setError(null); setMessage(null)
  }

  const switchMode = (m: Mode) => { reset(); setMode(m); setError(null); setMessage(null) }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabaseReady) { setError('Serviço de login temporariamente indisponível. Tente novamente mais tarde.'); return }
    setLoading(true); setError(null); setMessage(null)
    try {
      const supabase = getSupabaseBrowserClient()

      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) { setError('E-mail ou senha incorretos.'); return }
        const user = (await supabase.auth.getUser()).data.user
        if (user?.id) {
          await supabase.from('users').upsert({ id: user.id, email, full_name: fullName || null }, { onConflict: 'id' }).catch(() => {})
        }
        onAuthenticated?.()
        if (redirectTo) router.push(redirectTo)
      } else if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: fullName, cpf: cpf.replace(/\D/g, ''), phone: phone.replace(/\D/g, '') },
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          },
        })
        if (signUpError) {
          const raw = (signUpError as any)?.message || ''
          const friendly = raw.includes('already')
            ? 'Este e-mail já está cadastrado.'
            : raw
              ? `Não foi possível criar a conta: ${raw}`
              : 'Não foi possível criar a conta. Verifique os dados e tente novamente.'
          setError(friendly)
          console.error('Signup error:', signUpError)
          return
        }
        if (!data.user?.id) {
          setError('Não foi possível criar a conta. Tente novamente.')
          console.error('Signup returned no user id', data)
          return
        }
        if (data.session) {
          const { error: upsertError } = await supabase.from('users').upsert({ id: data.user.id, email, full_name: fullName, phone: phone.replace(/\D/g, ''), cpf: cpf.replace(/\D/g, '') }, { onConflict: 'id' })
          if (upsertError) {
            console.error('Failed to save user profile after signup:', upsertError)
            setError('Conta criada, mas não foi possível salvar seus dados no perfil. Entre em contato com o suporte.')
            return
          }
        }
        let welcomeSent = false
        try {
          const res = await fetch('/api/auth/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name: fullName }),
          })
          welcomeSent = res.ok
          if (!welcomeSent) {
            const text = await res.text().catch(() => '')
            console.error('Welcome email endpoint failed:', res.status, text)
          }
        } catch (e) { console.error('Welcome email fetch failed:', e) }
        setMessage(data.session ? 'Conta criada com sucesso!' : 'Conta criada! Confirme seu e-mail para continuar. Verifique também a pasta de spam.')
        if (data.session && onAuthenticated) onAuthenticated()
        if (data.session && redirectTo) router.push(redirectTo)
      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : undefined })
        if (resetError) { setError(resetError.message); return }
        setMessage('Link enviado! Verifique sua caixa de entrada e a pasta de spam.')
      }
    } finally { setLoading(false) }
  }

  const ErrorBanner = () => error ? (
    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
      <AlertCircle size={16} className="text-[var(--color-danger)] mt-0.5 shrink-0" />
      <p className="text-sm text-[var(--color-danger)]">{error}</p>
    </div>
  ) : null

  const SuccessBanner = () => message ? (
    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
      <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
      <p className="text-sm text-emerald-600">{message}</p>
    </div>
  ) : null

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-8 md:p-10">
      <AnimatePresence mode="wait">
        {/* ─── LOGIN ─── */}
        {mode === 'login' && (
          <motion.form key="login" {...fade} onSubmit={handleSubmit}>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Entrar</h2>
            <p className="mt-1.5 text-sm text-gray-500">Acesse para gerenciar seus anúncios e conversas.</p>

            {!supabaseReady && (
              <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-[var(--color-danger)]">Serviço de login indisponível no momento.</p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <InputField icon={Mail} id="login-email" label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" required />
              <InputField icon={Lock} id="login-password" label="Senha" type="password" value={password} onChange={setPassword} placeholder="Digite sua senha" required />
            </div>

            <div className="flex items-center justify-end mt-3">
              <button type="button" onClick={() => switchMode('forgot')} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Esqueceu a senha?
              </button>
            </div>

            <ErrorBanner />
            <SuccessBanner />

            <button type="submit" disabled={loading || !supabaseReady}
              className="w-full mt-5 h-11 rounded-xl bg-gray-900 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 active:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Entrar <ArrowRight size={16} /></>}
            </button>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <button type="button" onClick={() => switchMode('signup')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Não tem conta? <span className="font-medium text-gray-900">Criar conta</span>
              </button>
            </div>

            <p className="mt-5 text-[11px] text-gray-400 text-center">
              Ao continuar, você concorda com nossos{' '}
              <Link href="#" className="underline underline-offset-2 hover:text-gray-900 transition-colors">Termos</Link> e{' '}
              <Link href="#" className="underline underline-offset-2 hover:text-gray-900 transition-colors">Privacidade</Link>.
            </p>
          </motion.form>
        )}

        {/* ─── SIGNUP ─── */}
        {mode === 'signup' && (
          <motion.form key="signup" {...fade} onSubmit={handleSubmit}>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Criar conta</h2>
            <p className="mt-1.5 text-sm text-gray-500">Cadastro gratuito em dois passos.</p>

            {/* Step indicator */}
            <div className="flex items-center gap-3 mt-5 mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${step === 2 ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white'}`}>
                {step === 2 ? <Check size={14} strokeWidth={2.5} /> : '1'}
              </div>
              <div className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${step === 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${step === 2 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1 */}
              {step === 1 && (
                <motion.div key="step1" {...fade} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InputField icon={User} id="signup-first" label="Nome" value={firstName} onChange={setFirstName} placeholder="Ex: João" required />
                    <InputField icon={User} id="signup-last" label="Sobrenome" value={lastName} onChange={setLastName} placeholder="Ex: Silva" required />
                  </div>
                  <InputField icon={CreditCard} id="signup-cpf" label="CPF" value={cpf} onChange={(v) => setCpf(formatCPF(v))} placeholder="000.000.000-00" maxLength={14} required />
                </motion.div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <motion.div key="step2" {...fade} className="space-y-4">
                  <div className="flex items-center gap-3 mb-1">
                    <button type="button" onClick={() => setStep(1)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                      <ArrowRight size={14} className="text-gray-600 rotate-180" />
                    </button>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Dados de contato e acesso</h3>
                    </div>
                  </div>
                  <InputField icon={Phone} id="signup-phone" label="Telefone" type="tel" value={phone} onChange={(v) => setPhone(formatPhone(v))} placeholder="(00) 00000-0000" maxLength={15} required />
                  <InputField icon={Mail} id="signup-email" label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@email.com" required />
                  <InputField icon={Lock} id="signup-password" label="Senha" type="password" value={password} onChange={setPassword} placeholder="Crie uma senha" required />
                  <PasswordChecklist password={password} />
                  <InputField icon={Lock} id="signup-confirm" label="Confirmar senha" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repita a senha" required error={confirmPassword && !passwordsMatch ? 'As senhas não coincidem' : undefined} />
                </motion.div>
              )}
            </AnimatePresence>

            <ErrorBanner />
            <SuccessBanner />

            {mode === 'signup' && (
              step === 1 ? (
                <button type="button" disabled={!step1Valid}
                  onClick={() => { setError(null); setStep(2) }}
                  className="w-full mt-5 h-11 rounded-xl bg-gray-900 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  Continuar <ArrowRight size={16} />
                </button>
              ) : (
                <button type="submit" disabled={loading || !email || !passwordValid || !passwordsMatch}
                  className="w-full mt-5 h-11 rounded-xl bg-gray-900 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Criar conta <ArrowRight size={16} /></>}
                </button>
              )
            )}

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <button type="button" onClick={() => switchMode('login')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Já tem conta? <span className="font-medium text-gray-900">Entrar</span>
              </button>
            </div>

            <p className="mt-5 text-[11px] text-gray-400 text-center">
              Ao continuar, você concorda com nossos{' '}
              <Link href="#" className="underline underline-offset-2 hover:text-gray-900 transition-colors">Termos</Link> e{' '}
              <Link href="#" className="underline underline-offset-2 hover:text-gray-900 transition-colors">Privacidade</Link>.
            </p>
          </motion.form>
        )}

        {/* ─── FORGOT PASSWORD ─── */}
        {mode === 'forgot' && (
          <motion.form key="forgot" {...fade} onSubmit={handleSubmit}>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Redefinir senha</h2>
            <p className="mt-1.5 text-sm text-gray-500">Informe seu e-mail para receber um link de redefinição.</p>

            <div className="mt-6">
              <InputField icon={Mail} id="forgot-email" label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@email.com" required />
            </div>

            <ErrorBanner />
            <SuccessBanner />

            <button type="submit" disabled={loading || !supabaseReady}
              className="w-full mt-5 h-11 rounded-xl bg-gray-900 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Enviar link por e-mail <ArrowRight size={16} /></>}
            </button>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <button type="button" onClick={() => switchMode('login')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Voltar ao <span className="font-medium text-gray-900">login</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
