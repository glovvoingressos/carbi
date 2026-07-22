'use client'

import { ChangeEvent, useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  User, Mail, Phone, Lock, Camera, Save, Loader2,
  ChevronRight, AlertTriangle,
} from 'lucide-react'
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
    <div className="flex items-center gap-5">
      <div className="relative group">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
          {avatarUrl
            ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-gray-300" strokeWidth={1.5} /></div>}
        </div>
        <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
          <Camera className="w-5 h-5 text-white" strokeWidth={1.75} />
          <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={upload} />
        </label>
        {uploading && <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"><Loader2 className="w-5 h-5 text-white animate-spin" /></div>}
      </div>
      <div>
        <p className="text-base font-semibold text-[var(--color-text-primary)]">{fullName || 'Seu nome'}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">{email}</p>
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
    <div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Informações pessoais</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Nome completo</label>
          <input value={fullName} onChange={(e) => onNameChange(e.target.value)} placeholder="Ex: João Silva" className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" strokeWidth={1.75} />
            <input value={email} disabled className="input pl-10 opacity-60 cursor-not-allowed bg-gray-50" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Telefone</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" strokeWidth={1.75} />
            <input value={phone} onChange={(e) => onPhoneChange(formatPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className="input pl-10" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Security ─── */
function SecuritySection({ userId, toast }: { userId: string; toast: ToastFn }) {
  const [show, setShow] = useState(false)
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
      setShow(false); setNewPw(''); setConfirmPw('')
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Não foi possível alterar a senha.') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Segurança</h3>
      {!show ? (
        <button type="button" onClick={() => setShow(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[var(--color-text-primary)] hover:bg-gray-50 transition-colors">
          <Lock className="w-4 h-4" strokeWidth={1.75} /> Alterar senha <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
        </button>
      ) : (
        <motion.div {...fade} className="space-y-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Nova senha</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Mínimo 8 caracteres" className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Confirmar senha</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repita a senha" className="input" />
          </div>
          {newPw && confirmPw && newPw !== confirmPw && <p className="text-xs text-[var(--color-danger)]">As senhas não coincidem.</p>}
          <div className="flex gap-2">
            <button type="button" onClick={changePw} disabled={saving || newPw.length < 8 || newPw !== confirmPw}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-text-primary)] text-white text-sm font-medium hover:bg-[#2D2D2D] disabled:opacity-50 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
            </button>
            <button type="button" onClick={() => { setShow(false); setNewPw(''); setConfirmPw('') }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </div>
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
    <div>
      <h3 className="text-sm font-semibold text-[var(--color-danger)] mb-4">Excluir conta</h3>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">Essa ação é permanente e não pode ser desfeita.</p>
      {!show ? (
        <button type="button" onClick={() => setShow(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-danger)]/30 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5 transition-colors">
          <AlertTriangle className="w-4 h-4" /> Excluir conta
        </button>
      ) : (
        <motion.div {...fade} className="p-4 rounded-xl border border-[var(--color-danger)]/30 bg-[#FEF2F2]">
          <p className="text-sm text-[var(--color-danger)] font-medium mb-3">Digite &quot;EXCLUIR&quot; para confirmar:</p>
          <input value={delText} onChange={(e) => setDelText(e.target.value)} placeholder="EXCLUIR" className="input mb-3" />
          <div className="flex gap-2">
            <button type="button" onClick={deleteAccount} disabled={delText !== 'EXCLUIR'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-danger)] text-white text-sm font-medium hover:bg-[#B91C1C] disabled:opacity-50 transition-all">
              <AlertTriangle className="w-4 h-4" /> Confirmar exclusão
            </button>
            <button type="button" onClick={() => { setShow(false); setDelText('') }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </div>
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

  if (loading) return <div className="surface-strong p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--color-text-primary)]" /><p className="mt-3 text-sm text-[var(--color-text-secondary)]">Carregando perfil...</p></div>
  if (!userId) return null

  return (
    <motion.section {...fade} className="surface-strong p-5 md:p-8 space-y-8">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-danger)] text-white'}`}>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AvatarSection avatarUrl={avatarUrl} fullName={fullName} email={email} userId={userId} onAvatarChange={setAvatarUrl} uploading={uploading} />
      <div className="h-px bg-gray-100" />
      <PersonalInfo fullName={fullName} email={email} phone={phone} onNameChange={setFullName} onPhoneChange={setPhone} />
      <div className="h-px bg-gray-100" />
      <SecuritySection userId={userId} toast={showToast} />
      <div className="h-px bg-gray-100" />
      <button type="button" onClick={saveProfile} disabled={saving || uploading}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-text-primary)] text-white text-sm font-semibold hover:bg-[#2D2D2D] disabled:opacity-50 transition-all">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>
      <div className="h-px bg-gray-100" />
      <DangerZone userId={userId} toast={showToast} />
    </motion.section>
  )
}
