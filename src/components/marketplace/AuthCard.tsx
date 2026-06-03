'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
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
      setError('Autenticação indisponível: configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
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
    <div className={`rounded-[32px] border border-border bg-white shadow-sm ${compact ? 'p-6' : 'p-10'}`}>
      <h3 className="text-2xl font-heading font-black text-text-primary tracking-tight">Entre para anunciar</h3>
      <p className="text-sm font-bold text-text-secondary mt-3 leading-relaxed">Seu contato fica protegido: comprador e vendedor falam só pelo chat interno.</p>

      {!supabaseReady && (
        <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 shadow-sm">
          Ambiente sem Supabase configurado. O login/cadastro fica indisponível até configurar as variáveis públicas.
        </p>
      )}

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu e-mail"
          className="w-full rounded-2xl border border-border px-5 py-4 bg-bg-alt text-sm font-bold text-text-primary focus:outline-none focus:border-accent focus:bg-white transition-colors"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha"
          className="w-full rounded-2xl border border-border px-5 py-4 bg-bg-alt text-sm font-bold text-text-primary focus:outline-none focus:border-accent focus:bg-white transition-colors"
        />

        {error && <p className="text-sm font-bold text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">{error}</p>}
        {message && <p className="text-sm font-bold text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-100">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl bg-accent text-white text-xs font-black uppercase tracking-widest disabled:opacity-60 hover:bg-black transition-colors shadow-sm mt-4"
        >
          {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
            setError(null)
            setMessage(null)
          }}
          className="text-xs font-black uppercase tracking-widest text-text-tertiary hover:text-accent transition-colors"
        >
          {mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
        </button>
      </div>
    </div>
  )
}
