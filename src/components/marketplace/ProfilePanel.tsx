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
  account_type: string | null
  store_name: string | null
  cnpj: string | null
}

export default function ProfilePanel() {
  const supabaseReady = isSupabaseBrowserConfigured()
  const [sessionReady, setSessionReady] = useState(!supabaseReady)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [accountType, setAccountType] = useState<'pf' | 'revenda'>('pf')
  const [storeName, setStoreName] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!supabaseReady) {
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

      const { data } = supabase.auth.onAuthStateChange((_event: string, nextSession: { access_token?: string; user?: { id?: string; email?: string } } | null) => {
        setIsAuthenticated(!!nextSession)
        setUserId(nextSession?.user?.id || null)
        setEmail(nextSession?.user?.email || '')
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
        .select('id,email,full_name,avatar_url,account_type,store_name')
        .eq('id', userId)
        .maybeSingle()

      if (!existing) {
        await supabase.from('users').upsert({ id: userId, email: email || null })
      }

      const { data: profile } = await supabase
        .from('users')
        .select('id,email,full_name,avatar_url,account_type,store_name')
        .eq('id', userId)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setAvatarUrl(profile.avatar_url || '')
        setAccountType((profile.account_type as 'pf' | 'revenda') || 'pf')
        setStoreName(profile.store_name || '')
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
          account_type: accountType,
          store_name: storeName.trim() || null,
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
      <div className="surface-strong p-12 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#0A0A0A]" />
        <p className="mt-3 text-[14px] text-[#525252]">Carregando perfil...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthCard redirectTo="/minha-conta" />
  }

  return (
    <section className="profile-panel surface-strong p-8 md:p-10">
      <div className="profile-panel-head">
        <div>
          <h2>Configurações</h2>
          <p>Atualize seu nome e sua foto de perfil.</p>
        </div>
        <span className="profile-panel-chip">Conta ativa</span>
      </div>

      <div className="profile-panel-split">
        <div className="profile-avatar-card">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Foto de perfil" />
          ) : (
            <div className="profile-avatar-fallback">
              <User className="w-9 h-9 text-[#8A95A8]" strokeWidth={1.5} />
            </div>
          )}
          <label className="btn btn-secondary cursor-pointer profile-avatar-button">
            <Upload className="w-4 h-4" strokeWidth={1.75} />
            <span>{uploading ? 'Enviando...' : 'Trocar foto'}</span>
            <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} />
          </label>
        </div>

        <div className="profile-summary-card">
          <p className="profile-summary-label">Resumo da conta</p>
          <div className="profile-summary-row">
            <span>Nome</span>
            <strong>{fullName || 'Não informado'}</strong>
          </div>
          <div className="profile-summary-row">
            <span>E-mail</span>
            <strong>{email || 'Não informado'}</strong>
          </div>
          <div className="profile-summary-row">
            <span>Status</span>
            <strong>Chat interno ativo</strong>
          </div>
        </div>
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
            className="input opacity-60 cursor-not-allowed bg-white/60"
          />
        </div>
      </div>

      {/* Account Type */}
      <div className="mt-6 p-4 rounded-xl border border-[#E0E0E0] bg-[#FAFAF9]">
        <p className="text-[12px] font-medium text-[#525252] mb-3 tracking-tight">Tipo de conta</p>
        <div className="flex gap-2 mb-3">
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
        {accountType === 'revenda' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <label className="block text-[12px] font-medium text-[#525252] mb-1.5 tracking-tight">Nome da loja</label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Ex: Auto Carros"
              className="input"
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button onClick={saveProfile} disabled={saving || uploading} className="btn btn-primary">
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <p className="text-[12px] text-[#8A95A8] tracking-tight">
          Alterações salvas no banco real e refletidas no perfil da conta.
        </p>
      </div>

      {error && <p className="mt-4 text-[13px] text-[#DC2626] tracking-tight">{error}</p>}
      {success && <p className="mt-4 text-[13px] text-[#10B981] tracking-tight">{success}</p>}
    </section>
  )
}
