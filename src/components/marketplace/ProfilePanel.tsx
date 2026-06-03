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
      <div className="card p-8 text-center bg-card border border-border">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-accent" />
        <p className="mt-2 text-sm text-text-secondary">Carregando perfil...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthCard redirectTo="/minha-conta" />
  }

  return (
    <section className="card-elevated p-8 sm:p-12 shadow-sm border border-border bg-card">
      <h2 className="text-3xl font-display text-text-primary tracking-tight">Configurações</h2>
      <p className="mt-2 text-base text-text-secondary">Atualize seu nome e sua foto de perfil.</p>

      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Foto de perfil"
            className="h-28 w-28 rounded-xl bg-bg-alt object-cover border border-border"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-bg-alt text-3xl font-display text-text-primary border border-border">
            {(fullName || email || 'U').trim().charAt(0).toUpperCase()}
          </div>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 btn btn-secondary text-sm h-11 px-5">
          <Upload className="h-4 w-4 text-text-primary" />
          <span className="font-semibold text-text-primary">{uploading ? 'Enviando...' : 'Trocar foto'}</span>
          <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} />
        </label>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold tracking-wider text-text-secondary uppercase">Nome Completo</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            className="input font-semibold"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold tracking-wider text-text-tertiary uppercase">E-mail</label>
          <input
            value={email}
            disabled
            className="input font-semibold opacity-60 cursor-not-allowed bg-bg-alt/50"
          />
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={saveProfile}
          disabled={saving || uploading}
          className="btn btn-primary px-8 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm font-semibold text-danger">{error}</p> : null}
      {success ? <p className="mt-4 text-sm font-semibold text-success">{success}</p> : null}
    </section>
  )
}
