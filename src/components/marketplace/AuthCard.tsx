'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Mail, Lock } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

interface Props {
  onAuthenticated?: () => void
  compact?: boolean
  redirectTo?: string
}

export default function AuthCard({ onAuthenticated, compact = false, redirectTo }: Props) {
  const router = useRouter()
  const supabaseReady = isSupabaseBrowserConfigured()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
          setError(signInError.message)
          return
        }

        setMessage('Login efetuado com sucesso.')
        onAuthenticated?.()
        if (redirectTo) router.push(redirectTo)
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/anunciar-carro` : undefined,
          },
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        if (data.session) {
          setMessage('Conta criada e login realizado.')
          onAuthenticated?.()
          if (redirectTo) router.push(redirectTo)
        } else {
          setMessage('Conta criada. Confirme seu e-mail para continuar.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`surface-strong ${compact ? 'p-6' : 'p-8 md:p-10'}`}>
      <h2 className="text-[24px] md:text-[28px] font-semibold tracking-tight text-[#0A0A0A] text-balance">
        {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
      </h2>
      <p className="mt-2 text-[15px] text-[#52607A] tracking-tight text-pretty">
        {mode === 'login'
          ? 'Acesse para gerenciar seus anúncios e conversas.'
          : <>Comece a anunciar em menos de 2 minutos, <span className="font-black text-[#16855C]">é grátis</span>.</>}
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
          <label htmlFor="email" className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" strokeWidth={1.75} />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="input h-12 pl-11 pr-4 rounded-2xl"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" strokeWidth={1.75} />
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="input h-12 pl-11 pr-4 rounded-2xl"
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
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          {!loading && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-[#EAEAE8] text-center">
        <button
          type="button"
          onClick={() => {
            setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
            setError(null)
            setMessage(null)
          }}
          className="text-[14px] text-[#52607A] hover:text-[#0A0A0A] transition-colors"
        >
          {mode === 'login' ? (
            <>Não tem conta? <span className="text-[#0A0A0A] font-medium">Criar conta</span></>
          ) : (
            <>Já tem conta? <span className="text-[#0A0A0A] font-medium">Entrar</span></>
          )}
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
