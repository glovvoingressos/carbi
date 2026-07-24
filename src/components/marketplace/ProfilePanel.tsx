'use client'

import { ChangeEvent, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { User, Mail, Phone, Lock, Camera, Save, Loader2, ChevronDown, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.2 } }

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.length <= 10
    ? d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

type ToastFn = (type: 'success' | 'error', message: string) => void

/* ─── Avatar ─── */
function AvatarSection({ avatarUrl, fullName, email, userId, onAvatarChange, uploading }: {
  avatarUrl: string; fullName: string; email: string; userId: string
  onAvatarChange: (url: string) => void; uploading: boolean
}) {
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    const sb = getSupabaseBrowserClient()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/avatar.${ext}`
    const { error } = await sb.storage.from('profile-avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    const { data } = sb.storage.from('profile-avatars').getPublicUrl(path)
    onAvatarChange(data.publicUrl)
    await sb.from('users').update({ avatar_url: data.publicUrl }).eq('id', userId)
    e.target.value = ''
  }

  return (
    <motion.div {...fade}>
      <div className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(0,0,0,.05)] border border-gray-200">
        <div className="flex items-center gap-4 sm:gap-6 p-5 sm:p-7">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[var(--color-bg,#F7F7F7)] border-2 border-[var(--color-border,#ECECEC)]">
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 sm:w-10 sm:h-10 text-[#C8C8C8]" strokeWidth={1.25} /></div>}
            </div>
            <label htmlFor="avatar-upload" className="absolute inset-0 rounded-full bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center justify-center cursor-pointer transition-opacity duration-200">
              <Camera className="w-5 h-5 text-white" strokeWidth={1.75} />
              <span className="sr-only">Alterar foto do perfil</span>
              <input id="avatar-upload" type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={upload} />
            </label>
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-[#111] truncate">{fullName || 'Seu nome'}</p>
            <p className="text-sm text-[#7A7A7A] mt-0.5 truncate">{email}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Personal Info ─── */
function PersonalInfo({ fullName, email, phone, onNameChange, onPhoneChange }: {
  fullName: string; email: string; phone: string
  onNameChange: (v: string) => void; onPhoneChange: (v: string) => void
}) {
  return (
    <motion.div {...fade}>
      <div className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(0,0,0,.05)] border border-gray-200">
        <div className="p-5 sm:p-7">
          <h2 className="text-sm font-bold text-[#111] mb-5 font-[family-name:var(--font-heading)]">Informações pessoais</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#7A7A7A] mb-1.5 block">Nome completo</label>
              <input value={fullName} onChange={(e) => onNameChange(e.target.value)} placeholder="Ex: João Silva" className="rounded-2xl min-h-[44px]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#7A7A7A] mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C0C0C0] pointer-events-none" strokeWidth={1.5} />
                <input value={email} disabled className="rounded-2xl pl-11 bg-[#F7F7F7] opacity-60 cursor-not-allowed min-h-[44px]" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#7A7A7A] mb-1.5 block">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C0C0C0] pointer-events-none" strokeWidth={1.5} />
                <input value={phone} onChange={(e) => onPhoneChange(formatPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel" maxLength={15} className="rounded-2xl pl-11 min-h-[44px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
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
    <motion.div {...fade}>
      <div className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(0,0,0,.05)] border border-gray-200">
        <div className="p-5 sm:p-7">
          <h2 className="text-sm font-bold text-[#111] mb-5 font-[family-name:var(--font-heading)]">Segurança</h2>
          <button type="button" className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 transition-colors min-h-[44px]" onClick={() => setOpen(!open)}>
            <span className="flex items-center gap-3"><Lock className="w-4 h-4 text-[#7A7A7A]" strokeWidth={1.5} /> Alterar senha</span>
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="w-4 h-4 text-[#7A7A7A]" strokeWidth={1.5} /></motion.span>
          </button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                <div className="pt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#7A7A7A] mb-1.5 block">Nova senha</label>
                    <div className="relative">
                      <input type={showNewPw ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Mínimo 8 caracteres" className="rounded-2xl pr-14 min-h-[44px]" />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px]" onClick={() => setShowNewPw(!showNewPw)} aria-label={showNewPw ? 'Ocultar senha' : 'Mostrar senha'}>
                        {showNewPw ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#7A7A7A] mb-1.5 block">Confirmar senha</label>
                    <div className="relative">
                      <input type={showConfirmPw ? 'text' : 'password'} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repita a senha" className="rounded-2xl pr-14 min-h-[44px]" />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px]" onClick={() => setShowConfirmPw(!showConfirmPw)} aria-label={showConfirmPw ? 'Ocultar senha' : 'Mostrar senha'}>
                        {showConfirmPw ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                  {newPw && confirmPw && newPw !== confirmPw && (
                    <p className="text-xs font-medium text-[var(--color-danger,#DC2626)]">As senhas não coincidem.</p>
                  )}
              <div className="flex gap-3 pt-1">
                <button type="button" className="flex items-center gap-2 px-5 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors min-h-[44px]" onClick={changePw} disabled={saving || newPw.length < 8 || newPw !== confirmPw}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
                </button>
                <button type="button" className="px-5 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors min-h-[44px]" onClick={() => { setOpen(false); setNewPw(''); setConfirmPw('') }}>
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </motion.div>
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
    <motion.div {...fade}>
      <div className="border-[var(--color-danger,#DC2626)]/20">
        <div className="p-5 sm:p-7">
          <h2 className="text-sm font-bold text-[var(--color-danger,#DC2626)] mb-2 font-[family-name:var(--font-heading)]">Excluir conta</h2>
          <p className="text-sm text-[#7A7A7A] mb-4 leading-relaxed">Essa ação é permanente e não pode ser desfeita.</p>
          {!show ? (
            <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors min-h-[44px]" onClick={() => setShow(true)}
              className="rounded-full min-h-[44px]">
              <AlertTriangle className="w-4 h-4" /> Excluir conta
            </button>
          ) : (
            <motion.div {...fade} className="p-4 sm:p-5 rounded-2xl border border-[var(--color-danger,#DC2626)]/20 bg-[var(--color-danger,#DC2626)]/5">
              <label htmlFor="confirm-delete" className="block text-sm font-semibold text-[var(--color-danger,#DC2626)] mb-2">Digite &quot;EXCLUIR&quot; para confirmar:</label>
              <input id="confirm-delete" value={delText} onChange={(e) => setDelText(e.target.value)} placeholder="EXCLUIR"
                className="rounded-2xl border-[var(--color-danger,#DC2626)]/25 focus:ring-[var(--color-danger,#DC2626)]/30 mb-4 min-h-[44px]" />
              <div className="flex flex-wrap gap-3">
                <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors min-h-[44px]" onClick={deleteAccount} disabled={delText !== 'EXCLUIR' || deleting}
                  className="rounded-full min-h-[44px]">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />} {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
                </button>
                <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 transition-colors min-h-[44px]" onClick={() => { setShow(false); setDelText('') }}
                  className="rounded-full min-h-[44px]">
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
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
    <div className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(0,0,0,.05)] border border-gray-200">
      <div className="flex flex-col items-center gap-3 p-8">
        <Loader2 className="h-5 w-5 animate-spin text-[#7A7A7A]" />
        <p className="text-sm text-[#7A7A7A]">Carregando perfil...</p>
      </div>
    </div>
  )
  if (!userId) return null

  return (
    <section className="space-y-4">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            role="status" aria-live="polite"
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-full text-sm font-semibold shadow-[0_18px_50px_rgba(0,0,0,.12)] max-w-[calc(100vw-48px)] ${toast.type === 'success' ? 'bg-[var(--color-success,#16A34A)] text-white' : 'bg-[var(--color-danger,#DC2626)] text-white'}`}>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <PersonalInfo fullName={fullName} email={email} phone={phone} onNameChange={setFullName} onPhoneChange={setPhone} />
      <SecuritySection userId={userId} toast={showToast} />

      <motion.div {...fade}>
        <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors min-h-[44px]" onClick={saveProfile} disabled={saving || uploading}
          className="w-full rounded-full min-h-[48px] shadow-[0_8px_24px_rgba(0,0,0,.12)]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </motion.div>

      <DangerZone userId={userId} toast={showToast} />
    </section>
  )
}
