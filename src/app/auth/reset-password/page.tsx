'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    ;(async () => {
      try {
        const hash = window.location.hash
        if (hash) {
          const p = new URLSearchParams(hash.substring(1))
          const at = p.get('access_token')
          const rt = p.get('refresh_token')
          if (at && rt) {
            const { error: e } = await supabase.auth.setSession({ access_token: at, refresh_token: rt })
            if (e) throw e
            setSessionReady(true)
            setLoading(false)
            return
          }
        }
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setSessionReady(true)
        } else {
          router.replace('/entrar')
          return
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Link inválido ou expirado.')
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setMessage('Senha redefinida com sucesso!')
      setTimeout(() => router.push('/minha-conta'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Verificando link...</p>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500 text-center max-w-sm">{error || 'Link inválido ou expirado.'}</p>
        <button onClick={() => router.replace('/entrar')} className="text-sm underline text-gray-500">Voltar ao login</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Redefinir senha</h1>
          <p className="text-sm text-gray-500 mt-2">Digite sua nova senha</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 mb-4">
            <p className="text-sm text-emerald-600">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1A1A1A] mb-1">Nova senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F576] focus:border-transparent"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-[#1A1A1A] mb-1">Confirmar nova senha</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F576] focus:border-transparent"
              placeholder="Repita a senha"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#D4F576', color: '#1A1A1A' }}
          >
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
