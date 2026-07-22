'use client'

import { ChangeEvent, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { User, Mail, Phone, Lock, Camera, Save, Loader2, ChevronDown, AlertTriangle } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.2 } }
const INPUT = 'w-full px-5 py-3.5 rounded-[20px] border border-[#ECECEC] bg-white text-[15px] text-[#111111] placeholder:text-[#C0C0C0] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent,#111111)]/10 focus:border-[var(--color-accent,#111111)] transition-all duration-200'
const LABEL = 'block text-[13px] font-semibold text-[#7A7A7A] mb-2'
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
    <motion.div {...fade} className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(0,0,0,.05)] p-7 flex items-center gap-6">
      <div className="relative group shrink-0">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--color-bg,#F7F7F7)] border-2 border-[var(--color-border,#ECECEC)]">
          {avatarUrl
            ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><User className="w-10 h-10 text-[#C8C8C8]" strokeWidth={1.25} /></div>}
        </div>
        <label className="absolute inset-0 rounded-full bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity duration-200">
          <Camera className="w-5 h-5 text-white" strokeWidth={1.75} />
          <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={upload} />
        </label>
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold text-[#111111] truncate">{fullName || 'Seu nome'}</p>
        <p className="text-sm text-[#7A7A7A] mt-0.5 truncate">{email}</p>
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
    <motion.div {...fade} className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(0,0,0,.05)] p-7">
      <h3 className="text-[20px] font-bold text-[#111111] mb-6">Informações pessoais</h3>
      <div className="space-y-5">
        <div>
          <label className={LABEL}>Nome completo</label>
          <input value={fullName} onChange={(e) => onNameChange(e.target.value)} placeholder="Ex: João Silva" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>E-mail</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#C0C0C0] pointer-events-none" strokeWidth={1.5} />
            <input value={email} disabled className={`${INPUT} pl-11 bg-[#F7F7F7] opacity-60 cursor-not-allowed`} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Telefone</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#C0C0C0] pointer-events-none" strokeWidth={1.5} />
            <input value={phone} onChange={(e) => onPhoneChange(formatPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className={`${INPUT} pl-11`} />
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
    <motion.div {...fade} className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(0,0,0,.05)] p-7">
      <h3 className="text-[20px] font-bold text-[#111111] mb-6">Segurança</h3>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-[20px] border border-[#ECECEC] text-[15px] font-medium text-[#111111] hover:bg-[#F7F7F7] transition-colors duration-200">
        <span className="flex items-center gap-3"><Lock className="w-[18px] h-[18px] text-[#7A7A7A]" strokeWidth={1.5} /> Alterar senha</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="w-[18px] h-[18px] text-[#7A7A7A]" strokeWidth={1.5} /></motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
            <div className="pt-5 space-y-4">
              <div>
                <label className={LABEL}>Nova senha</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Mínimo 8 caracteres" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Confirmar senha</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repita a senha" className={INPUT} />
              </div>
              {newPw && confirmPw && newPw !== confirmPw && <p className="text-[13px] font-medium text-[var(--color-danger,#DC2626)]">As senhas não coincidem.</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={changePw} disabled={saving || newPw.length < 8 || newPw !== confirmPw}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#111111] text-white text-[14px] font-semibold hover:bg-[#2D2D2D] disabled:opacity-40 transition-all duration-200">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
                </button>
                <button type="button" onClick={() => { setOpen(false); setNewPw(''); setConfirmPw('') }}
                  className="px-5 py-3 rounded-full border border-[#ECECEC] text-[14px] font-medium text-[#7A7A7A] hover:bg-[#F7F7F7] transition-colors duration-200">
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Danger Zone ─── */
function DangerZone({ userId, toast }: { userId: string; toast: ToastFn }) {
  const [show, setShow] = useState(false)
  const [delText, setDelText] = useState('')

  const deleteAccount = async () => {
    try {
      const sb = getSupabaseBrowserClient()
      await sb.from('users').delete().eq('id', userId)
      await sb.auth.signOut()
      window.location.href = '/'
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Não foi possível excluir a conta.') }
  }

  return (
    <motion.div {...fade} className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(0,0,0,.05)] p-7">
      <h3 className="text-[20px] font-bold text-[var(--color-danger,#DC2626)] mb-3">Excluir conta</h3>
      <p className="text-[14px] text-[#7A7A7A] mb-5 leading-relaxed">Essa ação é permanente e não pode ser desfeita.</p>
      {!show ? (
        <button type="button" onClick={() => setShow(true)}
          className="flex items-center gap-2.5 px-5 py-3.5 rounded-full border border-[var(--color-danger,#DC2626)]/25 text-[14px] font-semibold text-[var(--color-danger,#DC2626)] hover:bg-[var(--color-danger,#DC2626)]/5 transition-colors duration-200">
          <AlertTriangle className="w-4 h-4" /> Excluir conta
        </button>
      ) : (
        <motion.div {...fade} className="p-5 rounded-[20px] border border-[var(--color-danger,#DC2626)]/20 bg-[var(--color-danger,#DC2626)]/5">
          <p className="text-[14px] font-semibold text-[var(--color-danger,#DC2626)] mb-3">Digite &quot;EXCLUIR&quot; para confirmar:</p>
          <input value={delText} onChange={(e) => setDelText(e.target.value)} placeholder="EXCLUIR"
            className={`${INPUT} border-[var(--color-danger,#DC2626)]/25 focus:ring-[var(--color-danger,#DC2626)]/10 mb-4`} />
          <div className="flex gap-3">
            <button type="button" onClick={deleteAccount} disabled={delText !== 'EXCLUIR'}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--color-danger,#DC2626)] text-white text-[14px] font-semibold hover:bg-[#B91C1C] disabled:opacity-40 transition-all duration-200">
              <AlertTriangle className="w-4 h-4" /> Confirmar exclusão
            </button>
            <button type="button" onClick={() => { setShow(false); setDelText('') }}
              className="px-5 py-3 rounded-full border border-[#ECECEC] text-[14px] font-medium text-[#7A7A7A] hover:bg-[#F7F7F7] transition-colors duration-200">
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

/* ─── Main ─── */
export default function ProfilePanel() {
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
    } catch (e) { showToast('error', e instanceof Error ? e.message : 'Não foi possível salvar.') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(0,0,0,.05)] p-8 flex flex-col items-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-[#7A7A7A]" />
      <p className="text-sm text-[#7A7A7A]">Carregando perfil...</p>
    </div>
  )
  if (!userId) return null

  return (
    <section className="space-y-5 max-w-[520px]">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-6 right-6 z-50 px-6 py-3.5 rounded-full text-[14px] font-semibold shadow-[0_18px_50px_rgba(0,0,0,.12)] ${toast.type === 'success' ? 'bg-[var(--color-success,#16A34A)] text-white' : 'bg-[var(--color-danger,#DC2626)] text-white'}`}>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AvatarSection avatarUrl={avatarUrl} fullName={fullName} email={email} userId={userId} onAvatarChange={setAvatarUrl} uploading={uploading} />
      <PersonalInfo fullName={fullName} email={email} phone={phone} onNameChange={setFullName} onPhoneChange={setPhone} />
      <SecuritySection userId={userId} toast={showToast} />

      <motion.button {...fade} type="button" onClick={saveProfile} disabled={saving || uploading}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-full bg-[#111111] text-white text-[15px] font-semibold hover:bg-[#2D2D2D] disabled:opacity-40 transition-all duration-200 shadow-[0_8px_24px_rgba(0,0,0,.12)]">
        {saving ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Save className="w-[18px] h-[18px]" />}
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </motion.button>

      <DangerZone userId={userId} toast={showToast} />
    </section>
  )
}
