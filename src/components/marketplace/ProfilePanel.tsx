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
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100">
      <div className="relative group shrink-0">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
          {avatarUrl
            ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-gray-300" strokeWidth={1.5} /></div>}
        </div>
        <label htmlFor="avatar-upload" className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
          <Camera className="w-4 h-4 text-white" strokeWidth={1.75} />
          <span className="sr-only">Alterar foto</span>
          <input id="avatar-upload" type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={upload} />
        </label>
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#1A1A1A] truncate">{fullName || 'Seu nome'}</p>
        <p className="text-xs text-gray-400 truncate">{email}</p>
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
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dados pessoais</h3>
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        <div className="p-4">
          <label className="text-xs text-gray-400 mb-1.5 block">Nome completo</label>
          <input value={fullName} onChange={(e) => onNameChange(e.target.value)} placeholder="Seu nome" className="w-full text-sm font-medium text-[#1A1A1A] placeholder-gray-300 focus:outline-none" />
        </div>
        <div className="p-4">
          <label className="text-xs text-gray-400 mb-1.5 block">E-mail</label>
          <input value={email} disabled className="w-full text-sm font-medium text-gray-500 bg-transparent cursor-not-allowed" />
        </div>
        <div className="p-4">
          <label className="text-xs text-gray-400 mb-1.5 block">Telefone / WhatsApp</label>
          <input value={phone} onChange={(e) => onPhoneChange(formatPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel" maxLength={15} className="w-full text-sm font-medium text-[#1A1A1A] placeholder-gray-300 focus:outline-none" />
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
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Segurança</h3>
      <div className="bg-white rounded-2xl border border-gray-100">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors rounded-2xl"
          onClick={() => setOpen(!open)}
        >
          <span className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
            Alterar senha
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
              <div className="px-4 pb-4 space-y-3">
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Nova senha (mín. 8 caracteres)"
                    className="w-full h-10 px-3 pr-10 rounded-xl bg-gray-50 border border-gray-100 text-sm text-[#1A1A1A] placeholder-gray-300 focus:outline-none focus:border-gray-300 transition-colors"
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Confirmar nova senha"
                    className="w-full h-10 px-3 pr-10 rounded-xl bg-gray-50 border border-gray-100 text-sm text-[#1A1A1A] placeholder-gray-300 focus:outline-none focus:border-gray-300 transition-colors"
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                    {showConfirmPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {newPw && confirmPw && newPw !== confirmPw && (
                  <p className="text-xs text-red-500">As senhas não coincidem.</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40"
                    onClick={changePw}
                    disabled={saving || newPw.length < 8 || newPw !== confirmPw}
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 text-[#D4F576]" />}
                    Salvar
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
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
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Zona de perigo</h3>
      <div className="bg-white rounded-2xl border border-red-100 p-4">
        <p className="text-xs text-gray-500 mb-3">Excluir sua conta é permanente. Todos os anúncios, favoritos e dados serão removidos.</p>
        {!show ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
            onClick={() => setShow(true)}
          >
            <AlertTriangle className="w-3 h-3" /> Excluir conta
          </button>
        ) : (
          <div className="space-y-3">
            <input
              id="confirm-delete"
              value={delText}
              onChange={(e) => setDelText(e.target.value)}
              placeholder='Digite "EXCLUIR"'
              className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-red-200 text-sm font-mono text-red-600 placeholder-gray-300 focus:outline-none focus:border-red-400 transition-colors"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-40"
                onClick={deleteAccount}
                disabled={delText !== 'EXCLUIR' || deleting}
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                {deleting ? 'Excluindo...' : 'Confirmar'}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-full text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                onClick={() => { setShow(false); setDelText('') }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
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
            className={`fixed top-20 right-4 z-50 px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg max-w-[calc(100vw-32px)] ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AvatarSection avatarUrl={avatarUrl} fullName={fullName} email={email} userId={userId} onAvatarChange={setAvatarUrl} uploading={uploading} onUploadingChange={setUploading} />
      <PersonalInfo fullName={fullName} email={email} phone={phone} onNameChange={setFullName} onPhoneChange={setPhone} />
      <SecuritySection userId={userId} toast={showToast} />

      <button
        type="button"
        className="w-full py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        onClick={saveProfile}
        disabled={saving || uploading}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#D4F576]" />}
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>

      <DangerZone userId={userId} toast={showToast} />
    </section>
  )
}
