'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Tabs } from '@base-ui/react/tabs'
import { Button } from '@base-ui/react/button'
import { ArrowUpRight, Bell, ChevronRight, FileText, HelpCircle, Loader2, LogOut, Shield, User } from 'lucide-react'
import AccountLayout from '@/components/marketplace/AccountLayout'
import ProfilePanel from '@/components/marketplace/ProfilePanel'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import '@/components/marketplace/member-profile.css'

type Member = { email: string; fullName: string; avatarUrl: string; phone?: string }

export default function ConfiguracoesPage() {
  const router = useRouter()
  const [user, setUser] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) { router.replace('/entrar?redirect=/minha-conta/configuracoes'); return }
    let active = true
    const supabase = getSupabaseBrowserClient()
    const load = async () => {
      setError('')
      setLoading(true)
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError) throw authError
        if (!active) return
        if (!session) { router.replace('/entrar?redirect=/minha-conta/configuracoes'); return }
        const { data, error: profileError } = await supabase.from('users').select('full_name,avatar_url,phone').eq('id', session.user.id).maybeSingle()
        if (profileError) throw profileError
        if (active) setUser({ email: session.user.email || '', fullName: data?.full_name || '', avatarUrl: data?.avatar_url || '', phone: data?.phone || '' })
      } catch {
        if (active) setError('Não foi possível carregar as configurações. Tente novamente.')
      } finally { if (active) setLoading(false) }
    }
    const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!active) return
      if (event === 'SIGNED_OUT') router.replace('/entrar?redirect=/minha-conta/configuracoes')
      if (session?.user) setUser(current => current ? { ...current, email: session.user.email || '' } : current)
    })
    void load()
    return () => { active = false; data.subscription.unsubscribe() }
  }, [router, retry])

  const signOut = async () => {
    setLoggingOut(true)
    setError('')
    try {
      const { error } = await getSupabaseBrowserClient().auth.signOut()
      if (error) throw error
      router.replace('/')
    } catch {
      setError('Não foi possível sair da conta. Tente novamente.')
      setLoggingOut(false)
    }
  }

  if (!user) return (
    <div className="member-shell">
      {loading ? <div className="mp-loading" role="status" aria-busy="true" aria-label="Carregando configurações"><div className="mp-skeleton mp-skeleton-photo" /><div className="mp-skeleton mp-skeleton-fields" /></div> : error ? <div className="mp-surface mp-empty"><p role="alert">{error}</p><Button className="mp-button mp-button-secondary" onClick={() => setRetry(value => value + 1)}>Tentar novamente</Button></div> : null}
    </div>
  )

  return (
    <AccountLayout user={user}>
      <section className="mp-settings" aria-label="Configurações da conta">
        {error && <p className="mp-feedback mp-feedback-error" role="alert">{error}</p>}
        <div className="mp-workspace">
          <Tabs.Root className="mp-settings-tabs" defaultValue="account">
            <Tabs.List className="mp-tabs-list" aria-label="Configurações da conta">
              <Tabs.Tab className="mp-tab" value="account">Conta</Tabs.Tab>
              <Tabs.Tab className="mp-tab" value="security">Segurança</Tabs.Tab>
              <Tabs.Tab className="mp-tab" value="information">Ajuda e privacidade</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel className="mp-tab-panel" value="account">
              <section className="mp-surface" aria-labelledby="settings-account-title">
                <header className="mp-panel-heading"><div><h2 id="settings-account-title">Sua conta</h2><p>Escolha o que deseja atualizar.</p></div></header>
                <Link href="/minha-conta?tab=perfil" className="mp-settings-row"><User aria-hidden="true" /><span><strong>Editar meu perfil</strong><small>Foto, nome e telefone / WhatsApp</small></span><ChevronRight aria-hidden="true" /></Link>
                <Link href="/minha-conta/notificacoes" className="mp-settings-row"><Bell aria-hidden="true" /><span><strong>Ver notificações</strong><small>Acompanhe os avisos da sua conta</small></span><ChevronRight aria-hidden="true" /></Link>
                <div className="mp-session-row"><div><h3>Sessão atual</h3><p>{user.email}</p></div><Button className="mp-button mp-button-secondary" onClick={signOut} disabled={loggingOut}>{loggingOut ? <Loader2 className="mp-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}{loggingOut ? 'Saindo…' : 'Sair da conta'}</Button></div>
              </section>
            </Tabs.Panel>
            <Tabs.Panel className="mp-tab-panel" value="security"><ProfilePanel mode="security" /></Tabs.Panel>
            <Tabs.Panel className="mp-tab-panel" value="information">
              <section className="mp-surface" aria-labelledby="settings-information-title">
                <header className="mp-panel-heading"><div><h2 id="settings-information-title">Ajuda e seus dados</h2><p>Encontre atendimento e consulte nossas políticas.</p></div></header>
                <Link href="/contato" className="mp-settings-row"><HelpCircle aria-hidden="true" /><span><strong>Falar com a Carbi</strong><small>Envie sua dúvida pelo canal de contato</small></span><ChevronRight aria-hidden="true" /></Link>
                <Link href="/privacidade" className="mp-settings-row"><Shield aria-hidden="true" /><span><strong>Política de privacidade</strong><small>Como seus dados são tratados</small></span><ChevronRight aria-hidden="true" /></Link>
                <Link href="/termos" className="mp-settings-row"><FileText aria-hidden="true" /><span><strong>Termos de uso</strong><small>Consulte as condições de uso da plataforma</small></span><ChevronRight aria-hidden="true" /></Link>
              </section>
            </Tabs.Panel>
          </Tabs.Root>
          <aside className="mp-aside" aria-label="Atalhos da conta">
            <div className="mp-note mp-note-lavender"><h2>Seu perfil, em dia</h2><p>Nome, foto e contatos podem ser editados na aba do perfil.</p><Link className="mp-text-link" href="/minha-conta?tab=perfil">Editar perfil <ArrowUpRight aria-hidden="true" /></Link></div>
            <div className="mp-note mp-note-green"><h2>Precisa de ajuda?</h2><p>Entre em contato com a equipe da Carbi.</p><Link className="mp-text-link" href="/contato">Falar com a equipe <ArrowUpRight aria-hidden="true" /></Link></div>
          </aside>
        </div>
      </section>
    </AccountLayout>
  )
}
