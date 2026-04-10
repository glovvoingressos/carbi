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
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/anunciar-carro-bh` : undefined,
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
    <div className={`pastel-card pastel-card-yellow ${compact ? 'p-5' : 'p-7'}`}>
      <h3 className="text-xl font-black text-dark">Entre para anunciar</h3>
      <p className="text-sm text-text-secondary mt-2">Seu contato fica protegido: comprador e vendedor falam só pelo chat interno.</p>

      {!supabaseReady && (
        <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          Ambiente sem Supabase configurado. O login/cadastro fica indisponível até configurar as variáveis públicas.
        </p>
      )}

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu e-mail"
          className="w-full rounded-2xl border border-border px-4 py-3 bg-surface focus:outline-none focus:ring-2 focus:ring-dark/20"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha"
          className="w-full rounded-2xl border border-border px-4 py-3 bg-surface focus:outline-none focus:ring-2 focus:ring-dark/20"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-[#dff7e8] text-dark border border-dark font-black py-3 disabled:opacity-60 hover:-translate-y-0.5 transition"
        >
          {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
          setError(null)
          setMessage(null)
        }}
        className="mt-4 text-sm font-bold text-dark underline"
      >
        {mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
      </button>
    </div>
  )
}
