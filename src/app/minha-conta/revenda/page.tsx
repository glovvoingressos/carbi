import type { Metadata } from 'next'
import Link from 'next/link'
import { Car, Eye, MessageCircle, TrendingUp, Plus, Upload, AlertTriangle } from 'lucide-react'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import RevendaKPICard from '@/components/revenda/RevendaKPICard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard da Revenda | Carbi',
  robots: { index: false, follow: false },
}

export default async function RevendaDashboardPage() {
  const client = getSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/entrar?redirect=/minha-conta/revenda')

  const { data: profile } = await client.from('users').select('*').eq('id', user.id).single()
  if (profile?.account_type !== 'revenda') redirect('/minha-conta')

  const { data: listings } = await client
    .from('vehicle_listings')
    .select('id, status, view_count, created_at')
    .eq('user_id', user.id)

  const totalVehicles = listings?.length || 0
  const activeVehicles = listings?.filter((l: any) => l.status === 'active').length || 0
  const soldVehicles = listings?.filter((l: any) => l.status === 'sold').length || 0
  const totalViews = listings?.reduce((sum: number, l: any) => sum + (l.view_count || 0), 0) || 0

  const { count: leadsCount } = await client
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)

  const { count: unreadMessages } = await client
    .from('conversation_messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', 'seller_id')
    .eq('read', false)

  return (
    <div className="fingen-page">
      <main className="fingen-main">
        <div className="fingen-shell-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Dashboard</h1>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{profile?.store_name || 'Minha Revenda'}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/minha-conta/revenda/importar" className="hero-creative-btn hero-creative-btn-white" style={{ padding: '10px 20px', fontSize: '13px' }}>
                <Upload size={16} /> Importar
              </Link>
              <Link href="/anunciar-carro" className="hero-creative-btn" style={{ padding: '10px 20px', fontSize: '13px' }}>
                <Plus size={16} /> Cadastrar
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <RevendaKPICard label="Total" value={totalVehicles} icon={Car} delay={0} />
            <RevendaKPICard label="Ativos" value={activeVehicles} icon={TrendingUp} delay={0.05} />
            <RevendaKPICard label="Vendidos" value={soldVehicles} icon={Car} delay={0.1} />
            <RevendaKPICard label="Visualizações" value={totalViews} icon={Eye} delay={0.15} />
            <RevendaKPICard label="Leads" value={leadsCount || 0} icon={MessageCircle} delay={0.2} />
          </div>

          <div style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #0D1F12 50%, #1A2F1E 100%)', borderRadius: '24px', padding: '32px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <AlertTriangle size={20} style={{ color: '#D4F576' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Próximos passos</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <Link href="/minha-conta/revenda/importar" style={{ display: 'block', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                Importar veículos de planilha
              </Link>
              <Link href="/anunciar-carro" style={{ display: 'block', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                Cadastrar veículo manualmente
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
