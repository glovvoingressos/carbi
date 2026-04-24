'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import AuthCard from '@/components/marketplace/AuthCard'

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
}

export default function ProfilePanel() {
  const supabaseReady = isSupabaseBrowserConfigured()
  const [sessionReady, setSessionReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!supabaseReady) {
      setSessionReady(true)
      setIsAuthenticated(false)
      return
    }

    let unsubscribe: (() => void) | null = null

    const boot = async () => {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setIsAuthenticated(!!session)
      setUserId(session?.user.id || null)
      setEmail(session?.user.email || '')
      setSessionReady(true)

      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setIsAuthenticated(!!nextSession)
        setUserId(nextSession?.user.id || null)
        setEmail(nextSession?.user.email || '')
      })
      unsubscribe = () => data.subscription.unsubscribe()
    }

    void boot()
    return () => unsubscribe?.()
  }, [supabaseReady])

  useEffect(() => {
    if (!isAuthenticated || !userId || !supabaseReady) return

    const loadProfile = async () => {
      const supabase = getSupabaseBrowserClient()
      setError(null)

      const { data: existing } = await supabase
        .from('users')
        .select('id,email,full_name,avatar_url')
        .eq('id', userId)
        .maybeSingle<ProfileRow>()

      if (!existing) {
        await supabase.from('users').upsert({
          id: userId,
          email: email || null,
        })
      }

      const { data: profile } = await supabase
        .from('users')
        .select('id,email,full_name,avatar_url')
        .eq('id', userId)
        .single<ProfileRow>()

      if (profile) {
        setFullName(profile.full_name || '')
        setAvatarUrl(profile.avatar_url || '')
      }
    }

    void loadProfile()
  }, [isAuthenticated, userId, email, supabaseReady])

  const saveProfile = async () => {
    if (!userId || !supabaseReady) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim() || null,
          avatar_url: avatarUrl || null,
          email: email || null,
        })
        .eq('id', userId)

      if (updateError) throw updateError
      setSuccess('Perfil atualizado com sucesso.')
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Falha ao salvar perfil.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userId || !supabaseReady) return

    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/avatar.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('profile-avatars').getPublicUrl(path)
      const publicUrl = urlData.publicUrl
      setAvatarUrl(publicUrl)

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
      if (updateError) throw updateError

      setSuccess('Foto de perfil atualizada.')
    } catch (uploadErr) {
      setError(uploadErr instanceof Error ? uploadErr.message : 'Falha no upload da foto.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  if (!sessionReady) {
    return (
      <div className="bg-white rounded-[32px] border border-black/5 p-8 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-dark" />
        <p className="mt-2 text-sm text-text-secondary">Carregando perfil...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthCard redirectTo="/minha-conta" />
  }

  return (
    <section className="bg-white rounded-[32px] border border-black/5 p-8 sm:p-12 shadow-sm">
      <h2 className="text-3xl font-black text-dark tracking-tight">Configurações</h2>
      <p className="mt-2 text-lg font-medium text-dark/50">Atualize seu nome e sua foto.</p>

      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Foto de perfil"
            className="h-28 w-28 rounded-[24px] bg-[#f5f5f3] object-cover border border-black/5"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-[24px] bg-[#f5f5f3] text-3xl font-black text-dark border border-black/5">
            {(fullName || email || 'U').trim().charAt(0).toUpperCase()}
          </div>
        )}
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-dark px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-dark/90">
          <Upload className="h-4 w-4" />
          {uploading ? 'Enviando...' : 'Trocar foto'}
          <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} />
        </label>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Seu nome completo"
          className="rounded-2xl bg-[#f5f5f3] border-none px-5 py-4 text-sm font-bold text-dark outline-none focus:ring-2 focus:ring-dark/20 transition-all"
        />
        <input
          value={email}
          disabled
          className="rounded-2xl bg-[#f5f5f3]/50 border-none px-5 py-4 text-sm font-bold text-dark/40"
        />
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={saveProfile}
          disabled={saving || uploading}
          className="rounded-full bg-dark px-8 py-4 text-sm font-bold text-white transition-all hover:bg-dark/90 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
      {success ? <p className="mt-3 text-sm font-semibold text-emerald-700">{success}</p> : null}
    </section>
  )
}
