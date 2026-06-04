'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { Loader2, Upload, User } from 'lucide-react'
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
      const { data: { session } } = await supabase.auth.getSession()
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
        await supabase.from('users').upsert({ id: userId, email: email || null })
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
      <div className="bg-white border border-[#EAEAE8] rounded-2xl p-12 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#0A0A0A]" />
        <p className="mt-3 text-[14px] text-[#525252]">Carregando perfil...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthCard redirectTo="/minha-conta" />
  }

  return (
    <section className="bg-white border border-[#EAEAE8] rounded-2xl p-8 md:p-10">
      <h1 className="text-[28px] font-semibold tracking-tight text-[#0A0A0A]">Configurações</h1>
      <p className="mt-2 text-[15px] text-[#525252]">Atualize seu nome e sua foto de perfil.</p>

      <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-5">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Foto de perfil" className="w-24 h-24 rounded-full object-cover border border-[#EAEAE8]" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-[#FAFAF9] flex items-center justify-center border border-[#EAEAE8]">
            <User className="w-9 h-9 text-[#A3A3A3]" strokeWidth={1.5} />
          </div>
        )}
        <label className="btn btn-secondary cursor-pointer">
          <Upload className="w-4 h-4" strokeWidth={1.75} />
          <span>{uploading ? 'Enviando...' : 'Trocar foto'}</span>
          <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} />
        </label>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">Nome completo</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            className="input"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">E-mail</label>
          <input
            value={email}
            disabled
            className="input opacity-60 cursor-not-allowed bg-[#FAFAF9]"
          />
        </div>
      </div>

      <div className="mt-8">
        <button onClick={saveProfile} disabled={saving || uploading} className="btn btn-primary">
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {error && <p className="mt-4 text-[13px] text-[#DC2626] tracking-tight">{error}</p>}
      {success && <p className="mt-4 text-[13px] text-[#10B981] tracking-tight">{success}</p>}
    </section>
  )
}
