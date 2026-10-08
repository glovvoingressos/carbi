'use client'

import { ChangeEvent, FormEvent, useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { Button } from '@base-ui/react/button'
import { Input } from '@base-ui/react/input'
import { AlertTriangle, ArrowUpRight, Camera, Check, ChevronDown, Eye, EyeOff, Loader2, Lock, Mail, Save, Shield, User } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import './member-profile.css'

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits.length <= 10
    ? digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}
const formatCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
type ToastFn = (type: 'success' | 'error', message: string) => void

function AvatarSection({ avatarUrl, userId, uploading, onAvatarChange, onUploadingChange, toast }: {
  avatarUrl: string; userId: string; uploading: boolean
  onAvatarChange: (url: string) => void; onUploadingChange: (value: boolean) => void; toast: ToastFn
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file || !userId) return
    onUploadingChange(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada. Faça login novamente para alterar a foto.')
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const { error } = await supabase.storage.from('profile-avatars').upload(`${userId}/avatar.${extension}`, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from('profile-avatars').getPublicUrl(`${userId}/avatar.${extension}`)
      const { error: updateError } = await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', userId).select()
      if (updateError) throw updateError
      onAvatarChange(data.publicUrl)
      toast('success', 'Foto atualizada com sucesso!')
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Não foi possível atualizar a foto. Tente novamente.')
    } finally {
      input.value = ''
      onUploadingChange(false)
    }
  }

  return (
    <div className="mp-photo-row" aria-busy={uploading}>
      <div className="mp-photo">
        {avatarUrl ? <Image src={avatarUrl} alt="Sua foto de perfil" width={56} height={56} unoptimized /> : <User aria-hidden="true" />}
      </div>
      <div className="mp-photo-copy">
        <h3>Foto do perfil</h3>
        <p>Escolha uma imagem JPG, PNG ou WebP.</p>
      </div>
      <input ref={inputRef} id={inputId} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={uploading} aria-label="Selecionar foto do perfil" />
      <Button type="button" className="mp-button mp-button-secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="mp-spin" aria-hidden="true" /> : <Camera aria-hidden="true" />}
        {uploading ? 'Enviando…' : 'Alterar foto'}
      </Button>
    </div>
  )
}

function SecuritySection({ email, toast }: { email: string; toast: ToastFn }) {
  const id = useId()
  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const passwordDetails = useRef<HTMLDetailsElement>(null)
  const mismatch = Boolean(confirmPassword && newPassword !== confirmPassword)

  const changeEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (emailSaving || !newEmail.trim() || newEmail.trim().toLowerCase() === email.toLowerCase()) return
    setEmailSaving(true)
    try {
      const { error } = await getSupabaseBrowserClient().auth.updateUser({ email: newEmail.trim() })
      if (error) throw error
      toast('success', 'Solicitação enviada. Confira seus e-mails para confirmar a alteração.')
      setNewEmail('')
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Não foi possível alterar o e-mail. Tente novamente.')
    } finally { setEmailSaving(false) }
  }

  const resetPassword = () => {
    setNewPassword(''); setConfirmPassword(''); setShowPassword(false); setShowConfirmation(false)
    if (passwordDetails.current) {
      passwordDetails.current.open = false
      passwordDetails.current.querySelector('summary')?.focus()
    }
  }

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving || newPassword !== confirmPassword || newPassword.length < 8) return
    setSaving(true)
    try {
      const { error } = await getSupabaseBrowserClient().auth.updateUser({ password: newPassword })
      if (error) throw error
      toast('success', 'Senha alterada com sucesso!')
      resetPassword()
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Erro ao alterar senha. Tente novamente.')
    } finally { setSaving(false) }
  }

  return (
    <section className="mp-surface mp-security" aria-labelledby={`${id}-heading`}>
      <header className="mp-panel-heading">
        <div><h2 id={`${id}-heading`}>Acesso e segurança</h2><p>Gerencie o e-mail de acesso e sua senha.</p></div>
        <Shield className="mp-heading-icon" aria-hidden="true" />
      </header>
      <details className="mp-disclosure">
        <summary><Mail aria-hidden="true" /><span><strong>Alterar e-mail</strong><small>{email || 'E-mail de acesso'}</small></span><ChevronDown className="mp-chevron" aria-hidden="true" /></summary>
        <form className="mp-details-body" onSubmit={changeEmail} aria-busy={emailSaving}>
          <div className="mp-field">
            <label htmlFor={`${id}-email`}>Novo e-mail</label>
            <Input id={`${id}-email`} className="mp-input" type="email" autoComplete="email" required value={newEmail} onChange={event => setNewEmail(event.target.value)} disabled={emailSaving} aria-describedby={`${id}-email-hint`} placeholder="voce@exemplo.com" />
            <p id={`${id}-email-hint`} className="mp-helper">O e-mail de acesso só muda após a confirmação por e-mail.</p>
          </div>
          <div className="mp-actions">
            <Button type="submit" className="mp-button mp-button-primary" disabled={emailSaving || !newEmail.trim() || newEmail.trim().toLowerCase() === email.toLowerCase()}>
              {emailSaving ? <Loader2 className="mp-spin" aria-hidden="true" /> : <Mail aria-hidden="true" />}
              {emailSaving ? 'Enviando…' : 'Confirmar novo e-mail'}
            </Button>
          </div>
        </form>
      </details>
      <details className="mp-disclosure" ref={passwordDetails}>
        <summary><Lock aria-hidden="true" /><span><strong>Alterar senha</strong><small>Escolha uma senha com pelo menos 8 caracteres.</small></span><ChevronDown className="mp-chevron" aria-hidden="true" /></summary>
        <form className="mp-details-body" onSubmit={changePassword} aria-busy={saving}>
          <div className="mp-fields">
            <div className="mp-field">
              <label htmlFor={`${id}-password`}>Nova senha</label>
              <div className="mp-password-input">
                <Input id={`${id}-password`} className="mp-input" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={newPassword} onChange={event => setNewPassword(event.target.value)} disabled={saving} aria-describedby={`${id}-password-hint`} />
                <Button type="button" className="mp-reveal" aria-label={showPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</Button>
              </div>
              <p className="mp-helper" id={`${id}-password-hint`}>Mínimo de 8 caracteres.</p>
            </div>
            <div className="mp-field">
              <label htmlFor={`${id}-confirmation`}>Confirmar nova senha</label>
              <div className="mp-password-input">
                <Input id={`${id}-confirmation`} className="mp-input" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} disabled={saving} aria-invalid={mismatch} aria-describedby={mismatch ? `${id}-mismatch` : undefined} />
                <Button type="button" className="mp-reveal" aria-label={showConfirmation ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'} aria-pressed={showConfirmation} onClick={() => setShowConfirmation(!showConfirmation)}>{showConfirmation ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</Button>
              </div>
              {mismatch && <p id={`${id}-mismatch`} className="mp-field-error" role="status">As senhas não coincidem.</p>}
            </div>
          </div>
          <div className="mp-actions">
            <Button type="submit" className="mp-button mp-button-primary" disabled={saving || newPassword.length < 8 || newPassword !== confirmPassword}>
              {saving ? <Loader2 className="mp-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}{saving ? 'Salvando…' : 'Salvar senha'}
            </Button>
            <Button type="button" className="mp-button mp-button-secondary" onClick={resetPassword} disabled={saving}>Cancelar</Button>
          </div>
        </form>
      </details>
    </section>
  )
}

function DangerZone({ userId, toast }: { userId: string; toast: ToastFn }) {
  const id = useId()
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const deleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (confirmation !== 'EXCLUIR' || deleting) return
    setDeleting(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from('users').delete().eq('id', userId)
      if (error) throw error
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      window.location.href = '/'
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Erro ao excluir conta. Tente novamente.')
      setDeleting(false)
    }
  }
  return (
    <details className="mp-surface mp-disclosure mp-danger" ref={detailsRef}>
      <summary><AlertTriangle aria-hidden="true" /><span><strong>Excluir minha conta</strong><small>Revise esta ação antes de confirmar.</small></span><ChevronDown className="mp-chevron" aria-hidden="true" /></summary>
      <form className="mp-details-body" onSubmit={deleteAccount} aria-busy={deleting}>
        <p className="mp-danger-copy">A exclusão da conta é permanente. Se deseja apenas sair, use a opção de sair da conta.</p>
        <div className="mp-field">
          <label htmlFor={`${id}-delete`}>Digite EXCLUIR para confirmar</label>
          <Input id={`${id}-delete`} className="mp-input" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" disabled={deleting} required />
        </div>
        <div className="mp-actions">
          <Button type="submit" className="mp-button mp-button-danger" disabled={confirmation !== 'EXCLUIR' || deleting}>{deleting ? <Loader2 className="mp-spin" aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}{deleting ? 'Excluindo…' : 'Confirmar exclusão'}</Button>
          <Button type="button" className="mp-button mp-button-secondary" disabled={deleting} onClick={() => { setConfirmation(''); if (detailsRef.current) { detailsRef.current.open = false; detailsRef.current.querySelector('summary')?.focus() } }}>Cancelar</Button>
        </div>
      </form>
    </details>
  )
}

export default function ProfilePanel({ onProfileUpdate, mode = 'profile' }: {
  onProfileUpdate?: () => void; mode?: 'profile' | 'security'
}) {
  const id = useId()
  const supabaseReady = isSupabaseBrowserConfigured()
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(mode === 'profile')
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profileError, setProfileError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const showToast = useCallback<ToastFn>((type, message) => setToast({ type, message }), [])

  useEffect(() => {
    if (!supabaseReady) return
    let active = true
    const supabase = getSupabaseBrowserClient()
    const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!active) return
      setUserId(session?.user.id || null)
      setEmail(session?.user.email || '')
    })
    const boot = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!active) return
        if (error) throw error
        setUserId(session?.user.id || null)
        setEmail(session?.user.email || '')
      } catch {
        if (active) showToast('error', 'Não foi possível carregar a conta. Atualize a página para tentar novamente.')
      } finally { if (active) setLoading(false) }
    }
    void boot()
    return () => { active = false; data.subscription.unsubscribe() }
  }, [supabaseReady, showToast])

  useEffect(() => {
    if (!userId || !supabaseReady || mode === 'security') return
    let active = true
    const load = async () => {
      setProfileLoading(true)
      setProfileError(false)
      try {
        const { data, error } = await getSupabaseBrowserClient().from('users').select('id,email,full_name,avatar_url,phone,cpf').eq('id', userId).maybeSingle()
        if (error) throw error
        if (!active) return
        setFullName(data?.full_name || '')
        setAvatarUrl(data?.avatar_url || '')
        setPhone(formatPhone(data?.phone || ''))
        setCpf(data?.cpf || '')
      } catch {
        if (active) { setProfileError(true); showToast('error', 'Não foi possível carregar seus dados. Tente novamente.') }
      } finally { if (active) setProfileLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [userId, supabaseReady, mode, retry, showToast])

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!userId || !supabaseReady || saving || uploading || profileError) return
    setSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada. Faça login novamente.')
      const updateData: { full_name?: string; phone?: string; cpf?: string } = {}
      if (fullName.trim()) updateData.full_name = fullName.trim()
      if (phone.replace(/\D/g, '')) updateData.phone = phone.replace(/\D/g, '')
      if (cpf.replace(/\D/g, '')) updateData.cpf = cpf.replace(/\D/g, '')
      const { error } = await supabase.from('users').update(updateData).eq('id', userId).select()
      if (error) throw error
      showToast('success', 'Perfil atualizado com sucesso!')
      onProfileUpdate?.()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Erro ao salvar perfil. Tente novamente.')
    } finally { setSaving(false) }
  }

  if (!supabaseReady || (!loading && !userId)) return (
    <div className="mp-surface mp-empty" role={toast ? 'alert' : 'status'}>
      <p>{toast?.message || 'Entre na sua conta para gerenciar seus dados.'}</p>
      <Link className="mp-text-link" href="/entrar?redirect=/minha-conta">Entrar na conta <ArrowUpRight aria-hidden="true" /></Link>
    </div>
  )
  if (loading || (mode === 'profile' && profileLoading)) return (
    <div className="mp-loading" aria-busy="true" role="status" aria-label="Carregando seu perfil">
      <div className="mp-skeleton mp-skeleton-photo" /><div className="mp-skeleton mp-skeleton-fields" />
    </div>
  )
  if (!userId) return null

  const feedback = toast && (
    <div className={`mp-feedback mp-feedback-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-atomic="true">
      {toast.type === 'success' ? <Check aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}<span>{toast.message}</span>
      <Button type="button" className="mp-feedback-dismiss" onClick={() => setToast(null)} aria-label="Fechar mensagem">Fechar</Button>
    </div>
  )

  if (mode === 'security') return <div className="mp-stack">{feedback}<SecuritySection email={email} toast={showToast} /><DangerZone userId={userId} toast={showToast} /></div>

  return (
    <section className="mp-profile" aria-label="Editar perfil">
      {feedback}
      <div className="mp-workspace">
        <div className="mp-stack">
          <section className="mp-surface" aria-labelledby={`${id}-personal`}>
            <header className="mp-panel-heading"><div><h2 id={`${id}-personal`}>Meu perfil</h2><p>Sua foto e seus dados de contato.</p></div><User className="mp-heading-icon" aria-hidden="true" /></header>
            {profileError ? <div className="mp-empty"><p>Seus dados não foram carregados.</p><Button type="button" className="mp-button mp-button-secondary" onClick={() => { setToast(null); setRetry(value => value + 1) }}>Tentar novamente</Button></div> : <>
              <AvatarSection avatarUrl={avatarUrl} userId={userId} uploading={uploading} onUploadingChange={setUploading} toast={showToast} onAvatarChange={url => { setAvatarUrl(url); onProfileUpdate?.() }} />
              <form className="mp-personal-form" onSubmit={saveProfile} aria-busy={saving}>
                <div className="mp-fields">
                  <div className="mp-field"><label htmlFor={`${id}-name`}>Nome completo</label><Input className="mp-input" id={`${id}-name`} autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Seu nome" disabled={saving} /></div>
                  <div className="mp-field"><label htmlFor={`${id}-phone`}>Telefone / WhatsApp</label><Input className="mp-input" id={`${id}-phone`} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={15} value={phone} onChange={event => setPhone(formatPhone(event.target.value))} placeholder="(00) 00000-0000" disabled={saving} /></div>
                  <div className="mp-field"><label htmlFor={`${id}-email`}>E-mail de acesso</label><Input className="mp-input" id={`${id}-email`} type="email" value={email} readOnly aria-describedby={`${id}-email-hint`} /><p className="mp-helper" id={`${id}-email-hint`}>Para alterar, abra “Alterar e-mail” abaixo.</p></div>
                  <div className="mp-field"><label htmlFor={`${id}-cpf`}>CPF</label><Input className="mp-input" id={`${id}-cpf`} value={formatCPF(cpf)} readOnly placeholder="Não informado" aria-describedby={`${id}-cpf-hint`} /><p className="mp-helper" id={`${id}-cpf-hint`}>Documento informado no cadastro.</p></div>
                </div>
                <footer className="mp-form-footer"><p>Salve depois de editar seus dados.</p><Button type="submit" className="mp-button mp-button-primary" disabled={saving || uploading}>{saving ? <Loader2 className="mp-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}{saving ? 'Salvando…' : 'Salvar alterações'}</Button></footer>
              </form>
            </>}
          </section>
          <SecuritySection email={email} toast={showToast} />
          <DangerZone userId={userId} toast={showToast} />
        </div>
        <aside className="mp-aside" aria-label="Sobre seu perfil">
          <div className="mp-note mp-note-green"><h2>Seus contatos</h2><p>Mantenha nome e telefone atualizados para suas negociações.</p><Link href="/minha-conta/conversas" className="mp-text-link">Abrir conversas <ArrowUpRight aria-hidden="true" /></Link></div>
          <div className="mp-note mp-note-lavender"><h2>Sobre seus dados</h2><p>Consulte como seus dados são tratados na política de privacidade.</p><Link href="/privacidade" className="mp-text-link">Ler política <ArrowUpRight aria-hidden="true" /></Link></div>
        </aside>
      </div>
    </section>
  )
}
