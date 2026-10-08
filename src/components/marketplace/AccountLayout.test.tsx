// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountLayout, { type AccountWorkspaceListing } from './AccountLayout'

const mocks = vi.hoisted(() => ({ params:new URLSearchParams(), replace:vi.fn(),refresh:vi.fn(), signOut:vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname:() => '/minha-conta', useSearchParams:() => mocks.params, useRouter:() => ({replace:mocks.replace, refresh:mocks.refresh}) }))
vi.mock('next/link', () => ({default:({children,...props}: React.ComponentProps<'a'>) => <a {...props}>{children}</a>}))
vi.mock('@/lib/supabase-browser', () => ({getSupabaseBrowserClient:() => ({auth:{signOut:mocks.signOut}})}))
const vehicle: AccountWorkspaceListing = { id:'one',title:'2008 GT',brand:'Peugeot',model:'2008',price:135000,status:'active',year:2025,created_at:'2026-09-30',slug:'2008-gt',images:[] }
const user = {fullName:'Marina Costa',email:'marina@example.com',avatarUrl:''}
afterEach(() => { cleanup(); mocks.params = new URLSearchParams(); vi.clearAllMocks() })

describe('AccountLayout workspace', () => {
  it('shows the real portfolio and links a vehicle to its context', () => {
    render(<AccountLayout user={user} listings={[vehicle]} stats={[{label:'Visualizações',value:321}]}><p>Conteúdo da conta</p></AccountLayout>)
    expect(screen.getByRole('heading',{level:1}).textContent).toBe('Marina Costa')
    expect(screen.getByText('321')).toBeTruthy()
    expect(screen.getByText('2008 GT').closest('a')?.getAttribute('href')).toBe('/minha-conta?vehicle=one')
    expect(screen.getByRole('link',{name:'Criar anúncio'}).getAttribute('href')).toBe('/anunciar-carro')
  })
  it('never presents a loading portfolio as an empty account', () => {
    render(<AccountLayout user={user} loading listings={[]}><p>Conteúdo</p></AccountLayout>)
    expect(screen.getByRole('status').textContent).toBe('Carregando seus veículos…')
    expect(screen.queryByText('Seu próximo anúncio começa aqui.')).toBeNull()
    expect(screen.getAllByText('—')).toHaveLength(4)
  })
  it('switches navigation to the profile query without marking summary active', () => {
    mocks.params = new URLSearchParams('tab=perfil')
    render(<AccountLayout user={user} listings={[]}><p>Perfil</p></AccountLayout>)
    expect(screen.getByRole('link',{name:'Meu perfil'}).getAttribute('aria-current')).toBe('page')
    expect(screen.getAllByRole('link',{name:'Resumo'}).every(link => !link.hasAttribute('aria-current'))).toBe(true)
  })
  it('keeps a portfolio failure distinct from a genuine empty account', () => {
    const retry = vi.fn()
    render(<AccountLayout user={user} listings={[]} listingsError="Falha ao carregar anúncios." onListingsRetry={retry}><p>Conta</p></AccountLayout>)
    expect(screen.getByRole('alert').textContent).toContain('Falha ao carregar anúncios.')
    expect(screen.queryByText('Seu próximo anúncio começa aqui.')).toBeNull()
    fireEvent.click(screen.getByRole('button',{name:'Tentar novamente'}))
    expect(retry).toHaveBeenCalledOnce()
  })
  it('opens searchable account navigation with an accessible dialog', async () => {
    render(<AccountLayout user={user} listings={[vehicle]}><p>Conta</p></AccountLayout>)
    fireEvent.click(screen.getByRole('button',{name:'Buscar na minha conta'}))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox'),{target:{value:'2008'}})
    expect(screen.getAllByText('2008 GT')).toHaveLength(2)
    expect(screen.getByRole('dialog').textContent).not.toContain('Configurações')
    fireEvent.change(screen.getByRole('searchbox'),{target:{value:'inexistente'}})
    expect(screen.getByText('Nada encontrado. Tente outro nome ou modelo.')).toBeTruthy()
  })
})
