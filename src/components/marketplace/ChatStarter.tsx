'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import AuthCard from '@/components/marketplace/AuthCard'

export default function ChatStarter({ listingId }: { listingId: string }) {
  const supabaseReady = isSupabaseBrowserConfigured()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)

  const openConversation = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!supabaseReady) {
        throw new Error('Chat indisponível: Supabase não configurado no ambiente.')
      }

      const supabase = getSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setShowAuth(true)
        return
      }

      const response = await fetch(`/api/marketplace/listings/${listingId}/conversation`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstMessage: 'Olá! Tenho interesse no seu veículo. Ele ainda está disponível?',
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível iniciar a conversa.')
      }

      router.push(`/minha-conta/conversas?conversation=${payload.conversationId}`)
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : 'Erro ao abrir conversa.')
    } finally {
      setLoading(false)
    }
  }

  if (showAuth) {
    return <AuthCard compact onAuthenticated={() => setShowAuth(false)} />
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={openConversation}
        disabled={loading}
        className="inline-flex w-full h-14 items-center justify-center gap-3 rounded-2xl bg-accent text-xs font-black uppercase tracking-widest text-white hover:bg-black disabled:opacity-60 transition-colors shadow-sm"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
        Conversar com vendedor
      </button>
      {error && <p className="text-xs font-bold text-red-600 text-center">{error}</p>}
    </div>
  )
}
