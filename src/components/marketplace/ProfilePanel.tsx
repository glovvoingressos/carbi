'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Phone, Lock, Camera, Save, Loader2,
  Building2, CreditCard, ChevronRight, AlertTriangle,
} from 'lucide-react'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'

type ProfileRow = {
  id: string; email: string | null; full_name: string | null; avatar_url: string | null
  phone: string | null; account_type: string | null; store_name: string | null; cnpj: string | null
}

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.2 } }
const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.length <= 10
    ? d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}
const formatCnpj = (v: string) => {
  let d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length > 12) d = d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8,12)+'-'+d.slice(12)
  else if (d.length > 8) d = d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8)
  else if (d.length > 5) d = d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5)
  else if (d.length > 2) d = d.slice(0,2)+'.'+d.slice(2)
  return d
}

export default function ProfilePanel() {
  const supabaseReady = isSupabaseBrowserConfigured()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [accountType, setAccountType] = useState<'pf' | 'revenda'>('pf')
  const [storeName, setStoreName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [showDel, setShowDel] = useState(false)
  const [delText, setDelText] = useState('')
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
        .from('users').select('id,email,full_name,avatar_url,phone,account_type,store_name,cnpj')
        .eq('id', userId).maybeSingle()
      if (data) {
        setFullName(data.full_name || ''); setAvatarUrl(data.avatar_url || '')
        setPhone(data.phone || ''); setAccountType((data.account_type as 'pf' | 'revenda') || 'pf')
        setStoreName(data.store_name || ''); setCnpj(data.cnpj || '')
      }
    }
    void load()
  }, [userId, supabaseReady])
  const toast_ = (type: 'success' | 'error', message: string) => { setToast({ type, message }); setTimeout(() => setToast(null), 3500) }
  const saveProfile = async () => {
    if (!userId || !supabaseReady) return
    setSaving(true)
    try {
      const { error } = await getSupabaseBrowserClient().from('users').update({
        full_name: fullName.trim() || null, phone: phone.replace(/\D/g, '') || null,
        account_type: accountType, store_name: storeName.trim() || null, cnpj: cnpj.replace(/\D/g, '') || null,
      }).eq('id', userId)
      if (error) throw error
      toast_('success', 'Perfil atualizado com sucesso.')
    } catch (e) { toast_('error', e instanceof Error ? e.message : 'Falha ao salvar.') }
    finally { setSaving(false) }
  }

  const uploadAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId || !supabaseReady) return
    setUploading(true)
    try {
      const sb = getSupabaseBrowserClient()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/avatar.${ext}`
      const { error: uErr } = await sb.storage.from('profile-avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (uErr) throw uErr
      const { data: u } = sb.storage.from('profile-avatars').getPublicUrl(path)
      setAvatarUrl(u.publicUrl)
      await sb.from('users').update({ avatar_url: u.publicUrl }).eq('id', userId)
      toast_('success', 'Foto de perfil atualizada.')
    } catch (e) { toast_('error', e instanceof Error ? e.message : 'Falha no upload.') }
    finally { setUploading(false); e.target.value = '' }
  }

  const changePw = async () => {
    if (!supabaseReady || newPw !== confirmPw || newPw.length < 8) return
    setPwSaving(true)
    try {
      const { error } = await getSupabaseBrowserClient().auth.updateUser({ password: newPw })
      if (error) throw error
      toast_('success', 'Senha alterada com sucesso.')
      setShowPw(false); setNewPw(''); setConfirmPw('')
    } catch (e) { toast_('error', e instanceof Error ? e.message : 'Falha ao alterar senha.') }
    finally { setPwSaving(false) }
  }

  const deleteAccount = async () => {
    if (!userId || !supabaseReady) return
    try {
      await getSupabaseBrowserClient().from('users').delete().eq('id', userId)
      await getSupabaseBrowserClient().auth.signOut()
      window.location.href = '/'
    } catch (e) { toast_('error', e instanceof Error ? e.message : 'Falha ao excluir.') }
  }
  if (loading) return <div className="surface-strong p-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-[#0A0A0A]" /><p className="mt-3 text-sm text-[#525252]">Carregando perfil...</p></div>

  return (
    <motion.section {...fade} className="surface-strong p-8 md:p-10 space-y-8">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-[#16855C] text-white' : 'bg-[#DC2626] text-white'}`}>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
            {avatarUrl
              ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-gray-300" strokeWidth={1.5} /></div>}
          </div>
          <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
            <Camera className="w-5 h-5 text-white" strokeWidth={1.75} />
            <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} />
          </label>
          {uploading && <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"><Loader2 className="w-5 h-5 text-white animate-spin" /></div>}
        </div>
        <div>
          <p className="text-base font-semibold text-[#0A0A0A]">{fullName || 'Seu nome'}</p>
          <p className="text-sm text-[#525252]">{email}</p>
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Personal Info */}
      <div>
        <h3 className="text-sm font-semibold text-[#0A0A0A] mb-4">Informações pessoais</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[#525252] mb-1.5">Nome completo</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#525252] mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" strokeWidth={1.75} />
              <input value={email} disabled className="input pl-10 opacity-60 cursor-not-allowed bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#525252] mb-1.5">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" strokeWidth={1.75} />
              <input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className="input pl-10" />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100" />
      {/* Account Type */}
      <div>
        <h3 className="text-sm font-semibold text-[#0A0A0A] mb-4">Tipo de conta</h3>
        <div className="flex gap-2 mb-4">
          {([['pf','Pessoa Física'],['revenda','Revenda']] as const).map(([v,l]) => (
            <button key={v} type="button" onClick={() => setAccountType(v)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all ${accountType === v ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'bg-white text-[#525252] border-gray-200 hover:border-gray-400'}`}>
              {l}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {accountType === 'revenda' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">Nome da loja</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" strokeWidth={1.75} />
                  <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex: Auto Carros" className="input pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">CNPJ</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" strokeWidth={1.75} />
                  <input value={cnpj} onChange={(e) => setCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" maxLength={18} className="input pl-10" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-px bg-gray-100" />
      {/* Security */}
      <div>
        <h3 className="text-sm font-semibold text-[#0A0A0A] mb-4">Segurança</h3>
        {!showPw ? (
          <button type="button" onClick={() => setShowPw(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[#0A0A0A] hover:bg-gray-50 transition-colors">
            <Lock className="w-4 h-4" strokeWidth={1.75} /> Alterar senha <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
          </button>
        ) : (
          <motion.div {...fade} className="space-y-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
            <div>
              <label className="block text-xs font-medium text-[#525252] mb-1.5">Nova senha</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Mínimo 8 caracteres" className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#525252] mb-1.5">Confirmar senha</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repita a senha" className="input" />
            </div>
            {newPw && confirmPw && newPw !== confirmPw && <p className="text-xs text-[#DC2626]">As senhas não coincidem.</p>}
            <div className="flex gap-2">
              <button type="button" onClick={changePw} disabled={pwSaving || newPw.length < 8 || newPw !== confirmPw}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#2D2D2D] disabled:opacity-50 transition-all">
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
              </button>
              <button type="button" onClick={() => { setShowPw(false); setNewPw(''); setConfirmPw('') }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[#525252] hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="h-px bg-gray-100" />

      {/* Save */}
      <button type="button" onClick={saveProfile} disabled={saving || uploading}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A0A0A] text-white text-sm font-semibold hover:bg-[#2D2D2D] disabled:opacity-50 transition-all">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>

      <div className="h-px bg-gray-100" />

      {/* Danger Zone */}
      <div>
        <h3 className="text-sm font-semibold text-[#DC2626] mb-4">Zona de perigo</h3>
        <p className="text-sm text-[#525252] mb-4">Excluir sua conta é irreversível.</p>
        {!showDel ? (
          <button type="button" onClick={() => setShowDel(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DC2626]/30 text-sm font-medium text-[#DC2626] hover:bg-[#DC2626]/5 transition-colors">
            <AlertTriangle className="w-4 h-4" /> Excluir conta
          </button>
        ) : (
          <motion.div {...fade} className="p-4 rounded-xl border border-[#DC2626]/30 bg-[#FEF2F2]">
            <p className="text-sm text-[#DC2626] font-medium mb-3">Digite &quot;EXCLUIR&quot; para confirmar:</p>
            <input value={delText} onChange={(e) => setDelText(e.target.value)} placeholder="EXCLUIR" className="input mb-3" />
            <div className="flex gap-2">
              <button type="button" onClick={deleteAccount} disabled={delText !== 'EXCLUIR'}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DC2626] text-white text-sm font-medium hover:bg-[#B91C1C] disabled:opacity-50 transition-all">
                <AlertTriangle className="w-4 h-4" /> Confirmar exclusão
              </button>
              <button type="button" onClick={() => { setShowDel(false); setDelText('') }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[#525252] hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  )
}
