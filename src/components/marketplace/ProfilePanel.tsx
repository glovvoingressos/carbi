'use client'

import { ChangeEvent, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { User, Mail, Phone, Lock, Camera, Save, Loader2, ChevronDown, AlertTriangle, Eye, EyeOff, Check, Shield, CreditCard } from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.length <= 10
    ? d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

const formatCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')

type ToastFn = (type: 'success' | 'error', message: string) => void

/* ─── Avatar Section ─── */
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
      const { data: { session } } = await sb.auth.getSession()
      if (!session) {
        console.error('No session for avatar upload')
        return
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/avatar.${ext}`
      const { error } = await sb.storage.from('profile-avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (error) {
        console.error('Avatar upload error:', error)
        throw error
      }
      const { data } = sb.storage.from('profile-avatars').getPublicUrl(path)
      onAvatarChange(data.publicUrl)

      // Update avatar_url in users table
      const { data: updateData, error: updateError } = await sb.from('users').update({ avatar_url: data.publicUrl }).eq('id', userId).select()
      if (updateError) {
        console.error('Avatar URL update error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        })
        // Don't throw here - avatar was uploaded successfully
      } else {
        console.log('Avatar URL updated successfully:', updateData)
      }
      e.target.value = ''
    } catch (e) {
      console.error('Avatar upload failed:', e)
    } finally {
      onUploadingChange(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Cover */}
      <div className="h-32 relative" style={{ backgroundColor: '#16855C', backgroundImage: 'linear-gradient(135deg, #16855C 0%, #1A7A54 50%, #146B4A 100%)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(#D4F576_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
      </div>
      
      {/* Profile Info */}
      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 relative z-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-lg">
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-[#1A1A1A]"><User className="w-10 h-10 text-[#D4F576]" strokeWidth={1.5} /></div>}
            </div>
            <label htmlFor="avatar-upload" className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              <Camera className="w-6 h-6 text-white" strokeWidth={1.75} />
              <span className="sr-only">Alterar foto</span>
              <input id="avatar-upload" type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={upload} />
            </label>
            {uploading && (
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex-1 pb-1">
            <h1 className="text-2xl font-bold text-[#1A1A1A]">{fullName || 'Seu nome'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{email}</p>
          </div>

          <label htmlFor="avatar-upload" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] text-[#D4F576] rounded-xl text-sm font-semibold hover:bg-[#2D2D2D] transition-colors cursor-pointer shrink-0">
            <Camera className="w-4 h-4" />
            Alterar foto
          </label>
        </div>
      </div>
    </div>
  )
}

/* ─── Personal Info ─── */
function PersonalInfo({ fullName, email, phone, cpf, onNameChange, onPhoneChange }: {
  fullName: string; email: string; phone: string; cpf: string
  onNameChange: (v: string) => void; onPhoneChange: (v: string) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#16855C]/10 flex items-center justify-center">
          <User className="w-5 h-5 text-[#16855C]" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#1A1A1A]">Informações pessoais</h3>
          <p className="text-xs text-gray-500">Atualize seus dados de contato</p>
        </div>
      </div>
      
      <div className="space-y-5">
        <div>
          <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Nome completo</label>
          <input 
            type="text"
            value={fullName} 
            onChange={(e) => onNameChange(e.target.value)} 
            placeholder="Seu nome" 
            className="w-full h-12 px-4 rounded-xl bg-[#F8F9FA] border border-gray-200 text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-[#16855C] focus:ring-2 focus:ring-[#16855C]/10 transition-all" 
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={email} disabled className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#F8F9FA] border border-gray-200 text-sm text-gray-500 cursor-not-allowed" />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">CPF</label>
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              value={formatCPF(cpf)} 
              disabled 
              placeholder="000.000.000-00" 
              maxLength={14} 
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#F8F9FA] border border-gray-200 text-sm text-gray-500 cursor-not-allowed" 
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Telefone / WhatsApp</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="tel"
              value={phone} 
              onChange={(e) => onPhoneChange(formatPhone(e.target.value))} 
              placeholder="(00) 00000-0000" 
              inputMode="tel" 
              maxLength={15} 
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#F8F9FA] border border-gray-200 text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-[#16855C] focus:ring-2 focus:ring-[#16855C]/10 transition-all" 
            />
          </div>
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
      toast('success', 'Senha alterada com sucesso!')
      setOpen(false); setNewPw(''); setConfirmPw('')
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Erro ao alterar senha.') }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#16855C]/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[#16855C]" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#1A1A1A]">Segurança</h3>
          <p className="text-xs text-gray-500">Proteja sua conta</p>
        </div>
      </div>

      <button
        type="button"
        className="w-full flex items-center justify-between p-4 rounded-xl bg-[#F8F9FA] border border-gray-200 text-sm font-medium text-[#1A1A1A] hover:bg-gray-100 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-3">
          <Lock className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
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
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-5 space-y-4">
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Nova senha (mín. 8 caracteres)"
                  className="w-full h-12 px-4 pr-12 rounded-xl bg-[#F8F9FA] border border-gray-200 text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-[#16855C] focus:ring-2 focus:ring-[#16855C]/10 transition-all"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#1A1A1A] transition-colors" onClick={() => setShowNewPw(!showNewPw)}>
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Confirmar nova senha"
                  className="w-full h-12 px-4 pr-12 rounded-xl bg-[#F8F9FA] border border-gray-200 text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-[#16855C] focus:ring-2 focus:ring-[#16855C]/10 transition-all"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#1A1A1A] transition-colors" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPw && confirmPw && newPw !== confirmPw && (
                <p className="text-sm font-medium text-[#DC2626]">As senhas não coincidem.</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-40"
                  style={{ backgroundColor: '#16855C' }}
                  onClick={changePw}
                  disabled={saving || newPw.length < 8 || newPw !== confirmPw}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar senha
                </button>
                <button
                  type="button"
                  className="px-5 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
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
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Erro ao excluir conta.'); setDeleting(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#DC2626]/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#DC2626]/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-[#DC2626]" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#DC2626]">Zona de perigo</h3>
          <p className="text-xs text-gray-500">Ações irreversíveis</p>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-5">Excluir sua conta é permanente. Todos os seus anúncios, dados e histórico serão removidos para sempre.</p>
      
      {!show ? (
        <button
          type="button"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#DC2626] text-[#DC2626] text-sm font-semibold hover:bg-[#DC2626]/5 transition-colors"
          onClick={() => setShow(true)}
        >
          <AlertTriangle className="w-4 h-4" />
          Excluir minha conta
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-4 rounded-xl bg-[#DC2626]/5 border border-[#DC2626]/20">
            <p className="text-sm font-semibold text-[#DC2626] mb-2">Digite &quot;EXCLUIR&quot; para confirmar:</p>
            <input
              id="confirm-delete"
              value={delText}
              onChange={(e) => setDelText(e.target.value)}
              placeholder='EXCLUIR'
              className="w-full h-12 px-4 rounded-xl bg-white border border-[#DC2626]/30 text-sm font-mono font-bold text-[#DC2626] placeholder-gray-400 focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#DC2626] text-white text-sm font-semibold hover:bg-[#DC2626]/90 transition-colors disabled:opacity-40 shadow-sm"
              onClick={deleteAccount}
              disabled={delText !== 'EXCLUIR' || deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
            </button>
            <button
              type="button"
              className="px-5 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => { setShow(false); setDelText('') }}
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

/* ─── Main Profile Panel ─── */
export default function ProfilePanel({ onProfileUpdate }: { onProfileUpdate?: () => void }) {
  const supabaseReady = isSupabaseBrowserConfigured()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')
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
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from('users').select('id,email,full_name,avatar_url,phone,cpf')
          .eq('id', userId).maybeSingle()
        if (error) {
          console.error('Error loading user profile:', error)
          return
        }
        if (data) {
          setFullName(data.full_name || '')
          setAvatarUrl(data.avatar_url || '')
          setPhone(data.phone || '')
          setCpf(data.cpf || '')
        }
      } catch (e) {
        console.error('Failed to load profile:', e)
      }
    }
    void load()
  }, [userId, supabaseReady])

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message }); setTimeout(() => setToast(null), 3500)
  }, [])

  const saveProfile = async () => {
    if (!userId || !supabaseReady) {
      showToast('error', 'Usuário não autenticado.')
      return
    }
    setSaving(true)
    try {
      const sb = getSupabaseBrowserClient()
      const { data: { session } } = await sb.auth.getSession()
      if (!session) {
        showToast('error', 'Sessão expirada. Faça login novamente.')
        return
      }

      // Prepare update data - only send non-null values
      const updateData: { full_name?: string | null; phone?: string | null; cpf?: string | null } = {}
      if (fullName.trim()) {
        updateData.full_name = fullName.trim()
      }
      if (phone.replace(/\D/g, '')) {
        updateData.phone = phone.replace(/\D/g, '')
      }
      if (cpf.replace(/\D/g, '')) {
        updateData.cpf = cpf.replace(/\D/g, '')
      }

      console.log('Updating profile with:', { userId, updateData })

      const { data, error } = await sb.from('users').update(updateData).eq('id', userId).select()

      if (error) {
        console.error('Supabase update error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(error.message || 'Erro ao salvar perfil')
      }

      console.log('Profile updated successfully:', data)
      showToast('success', 'Perfil atualizado com sucesso!')
      onProfileUpdate?.()
    } catch (e) {
      console.error('Save profile error:', e)
      showToast('error', e instanceof Error ? e.message : 'Erro ao salvar perfil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  )
  if (!userId) return null

  return (
    <section className="space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            role="status"
            aria-live="polite"
            className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl max-w-[calc(100vw-32px)] flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-[#16855C] text-white' : 'bg-[#DC2626] text-white'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AvatarSection avatarUrl={avatarUrl} fullName={fullName} email={email} userId={userId} onAvatarChange={setAvatarUrl} uploading={uploading} onUploadingChange={setUploading} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonalInfo fullName={fullName} email={email} phone={phone} cpf={cpf} onNameChange={setFullName} onPhoneChange={setPhone} />
        <SecuritySection userId={userId} toast={showToast} />
      </div>

      <div className="sticky bottom-28 lg:bottom-6 pt-4">
        <button
          type="button"
          className="w-full py-4 rounded-xl text-white text-base font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#16855C', boxShadow: '0 4px 12px rgba(22,133,92,0.25)' }}
          onClick={saveProfile}
          disabled={saving || uploading}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      <DangerZone userId={userId} toast={showToast} />
    </section>
  )
}
