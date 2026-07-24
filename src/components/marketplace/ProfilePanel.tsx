'use client'

import { ChangeEvent, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { User, Mail, Phone, Lock, Camera, Save, Loader2, ChevronDown, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.length <= 10
    ? d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

type ToastFn = (type: 'success' | 'error', message: string) => void

/* ─── Avatar ─── */
function AvatarSection({ avatarUrl, fullName, email, userId, onAvatarChange, uploading, onUploadingChange }: {
  avatarUrl: string; fullName: string; email: string; userId: string
  onAvatarChange: (url: string) => void; uploading: boolean; onUploadingChange: (v: boolean) => void
}) {
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    onUploadingChange(true)
    try {
      const sb = getSupabaseBrowserClient()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/avatar.${ext}`
      const { error } = await sb.storage.from('profile-avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data } = sb.storage.from('profile-avatars').getPublicUrl(path)
      onAvatarChange(data.publicUrl)
      await sb.from('users').update({ avatar_url: data.publicUrl }).eq('id', userId)
      e.target.value = ''
    } catch (e) {
      // silently ignore avatar upload errors in this inner component
    } finally {
      onUploadingChange(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Foto de perfil</h3>
      <div className="flex items-center gap-5">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-50 border-4 border-white shadow-md">
            {avatarUrl
              ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center bg-blue-100"><User className="w-8 h-8 text-blue-500" strokeWidth={1.5} /></div>}
          </div>
          <label htmlFor="avatar-upload" className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
            <Camera className="w-5 h-5 text-white" strokeWidth={1.75} />
            <span className="sr-only">Alterar foto</span>
            <input id="avatar-upload" type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={upload} />
          </label>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-gray-900 truncate">{fullName || 'Seu nome'}</p>
          <p className="text-sm text-gray-500 truncate mt-0.5">{email}</p>
          <label htmlFor="avatar-upload" className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors cursor-pointer">
            <Camera className="w-3.5 h-3.5" />
            Alterar foto
          </label>
        </div>
      </div>
    </div>
  )
}

/* ─── Personal Info ─── */
function PersonalInfo({ fullName, email, phone, onNameChange, onPhoneChange }: {
  fullName: string; email: string; phone: string
  onNameChange: (v: string) => void; onPhoneChange: (v: string) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Dados pessoais</h3>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">Nome completo</label>
          <input value={fullName} onChange={(e) => onNameChange(e.target.value)} placeholder="Seu nome" className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">E-mail</label>
          <input value={email} disabled className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-gray-200 text-sm text-gray-500 cursor-not-allowed" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">Telefone / WhatsApp</label>
          <input value={phone} onChange={(e) => onPhoneChange(formatPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel" maxLength={15} className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
      </div>
    </div>
  )
}

/* ─── Security ─── */
function SecuritySection({ userId, toast }: { userId: string; toast: ToastFn }) {
  const [open, setOpen] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const changePw = async () => {
    if (newPw !== confirmPw || newPw.length < 8) return
    setSaving(true)
    try {
      const { error } = await getSupabaseBrowserClient().auth.updateUser({ password: newPw })
      if (error) throw error
      toast('success', 'Senha alterada com sucesso.')
      setOpen(false); setNewPw(''); setConfirmPw('')
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Não foi possível alterar a senha.') }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Segurança</h3>
      <button
        type="button"
        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-3">
          <Lock className="w-4 h-4 text-gray-500" strokeWidth={1.75} />
          Alterar minha senha
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Nova senha (mín. 8 caracteres)"
                  className="w-full h-11 px-4 pr-11 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowNewPw(!showNewPw)}>
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Confirmar nova senha"
                  className="w-full h-11 px-4 pr-11 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPw && confirmPw && newPw !== confirmPw && (
                <p className="text-xs font-medium text-red-500">As senhas não coincidem.</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40"
                  onClick={changePw}
                  disabled={saving || newPw.length < 8 || newPw !== confirmPw}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar senha
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  onClick={() => { setOpen(false); setNewPw(''); setConfirmPw('') }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Danger Zone ─── */
function DangerZone({ userId, toast }: { userId: string; toast: ToastFn }) {
  const [show, setShow] = useState(false)
  const [delText, setDelText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      const sb = getSupabaseBrowserClient()
      await sb.from('users').delete().eq('id', userId)
      await sb.auth.signOut()
      window.location.href = '/'
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Não foi possível excluir a conta.'); setDeleting(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-red-600 mb-2">Zona de perigo</h3>
      <p className="text-xs text-gray-500 mb-4">Excluir sua conta é permanente. Todos os anúncios, favoritos e dados serão removidos.</p>
      {!show ? (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
          onClick={() => setShow(true)}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Excluir minha conta
        </button>
      ) : (
        <div className="space-y-3">
          <input
            id="confirm-delete"
            value={delText}
            onChange={(e) => setDelText(e.target.value)}
            placeholder='Digite "EXCLUIR" para confirmar'
            className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-red-200 text-sm text-red-600 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-40"
              onClick={deleteAccount}
              disabled={delText !== 'EXCLUIR' || deleting}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
            </button>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => { setShow(false); setDelText('') }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main ─── */
export default function ProfilePanel({ onProfileUpdate }: { onProfileUpdate?: () => void }) {
  const supabaseReady = isSupabaseBrowserConfigured()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!supabaseReady) return
    let unsub: (() => void) | null = null
    const boot = async () => {
      const sb = getSupabaseBrowserClient()
      const { data: { session } } = await sb.auth.getSession()
      if (session?.user) { setUserId(session.user.id); setEmail(session.user.email || '') }
      const { data } = sb.auth.onAuthStateChange((_e: string, s: { user?: { id?: string; email?: string } } | null) => { setUserId(s?.user?.id || null); setEmail(s?.user?.email || '') })
      unsub = () => data.subscription.unsubscribe()
      setLoading(false)
    }
    void boot()
    return () => unsub?.()
  }, [supabaseReady])

  useEffect(() => {
    if (!userId || !supabaseReady) return
    const load = async () => {
      const { data } = await getSupabaseBrowserClient()
        .from('users').select('id,email,full_name,avatar_url,phone')
        .eq('id', userId).maybeSingle()
      if (data) { setFullName(data.full_name || ''); setAvatarUrl(data.avatar_url || ''); setPhone(data.phone || '') }
    }
    void load()
  }, [userId, supabaseReady])

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message }); setTimeout(() => setToast(null), 3500)
  }, [])

  const saveProfile = async () => {
    if (!userId || !supabaseReady) return
    setSaving(true)
    try {
      const { error } = await getSupabaseBrowserClient().from('users').update({
        full_name: fullName.trim() || null, phone: phone.replace(/\D/g, '') || null,
      }).eq('id', userId)
      if (error) throw error
      showToast('success', 'Perfil atualizado com sucesso.')
      onProfileUpdate?.()
    } catch (e) { showToast('error', e instanceof Error ? e.message : 'Não foi possível salvar.') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
    </div>
  )
  if (!userId) return null

  return (
    <section className="space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            role="status"
            aria-live="polite"
            className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg max-w-[calc(100vw-32px)] ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Meu perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Atualize suas informações pessoais</p>
      </div>

      {/* Desktop: 2-column grid */}
      <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-6">
        <div className="space-y-6">
          <AvatarSection avatarUrl={avatarUrl} fullName={fullName} email={email} userId={userId} onAvatarChange={setAvatarUrl} uploading={uploading} onUploadingChange={setUploading} />
          <PersonalInfo fullName={fullName} email={email} phone={phone} onNameChange={setFullName} onPhoneChange={setPhone} />
        </div>
        <div className="space-y-6">
          <SecuritySection userId={userId} toast={showToast} />
          <DangerZone userId={userId} toast={showToast} />
        </div>
      </div>

      {/* Save button - sticky on mobile */}
      <div className="sticky bottom-24 lg:bottom-6 pt-4 pb-2">
        <button
          type="button"
          className="w-full py-4 rounded-2xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
          onClick={saveProfile}
          disabled={saving || uploading}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </section>
  )
}
