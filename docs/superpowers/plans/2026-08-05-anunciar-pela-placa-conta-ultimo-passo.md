# Anunciar pela Placa + Conta no Último Passo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users start a listing by typing their plate in the "Anuncie grátis por tempo limitado" card on the home page, fill the whole listing without logging in, then create the account (nome, telefone, CPF, email, senha) in the final step and publish immediately.

**Architecture:** Plate lookup already works (`PlateInput` → `/api/marketplace/placa`, no auth). A new client component (`PlateBannerLookup`) sits in the home promo card, looks up the plate, stores the full vehicle payload in `sessionStorage`, and navigates to `/anunciar-carro/fluxo?placa=XXX`. `ListingForm` reads that payload on mount, prefills the form, and jumps to the vehicle-confirm sub-step. The login gate in `ListingForm` is removed. In the final step, if not authenticated, a new server route `/api/auth/signup-publish` creates a **confirmed** account via service role; the client signs in and reuses the existing publish flow (listing POST + image upload).

**Tech Stack:** Next.js (App Router), TypeScript, Supabase (auth + postgres), motion/react, CSS custom properties (Carbi design system v6 tokens: `--color-accent #D4F576`, `--color-forest #1A2F1E`, `--radius-*`).

## Global Constraints

- Signup must publish immediately: account created with `email_confirm: true` via service role (`getSupabaseAdminClient`).
- Server route may never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Reuse existing helpers: `lookupPlateClient` (`src/lib/integrations/placaapi/client.ts`), `sendWelcomeEmail` (`src/lib/email.ts`), `validateCPF`/password rules matching `AuthCard.tsx`.
- User already logged in → final step shows no account form (just "Publicar anúncio").
- Email already registered at the final step → friendly message + link to `/entrar?redirect=/anunciar-carro/fluxo`.
- No test framework in repo (no vitest/jest). Verification = `npx tsc --noEmit` and `npm run build`.
- Do not commit unrelated debug files. Only stage files listed in each task.

---

### Task 1: Server route `/api/auth/signup-publish`

**Files:**
- Create: `src/app/api/auth/signup-publish/route.ts`

**Interfaces:**
- Consumes: `getSupabaseAdminClient` (`src/lib/supabase-server.ts:56`), `sendWelcomeEmail` (`src/lib/email.ts:564`).
- Produces: `POST /api/auth/signup-publish` with body `{ email, password, full_name, phone, cpf }`.
  - Success: `200 { ok: true, email }`.
  - Duplicate email: `409 { error: 'email_exists' }`.
  - Validation error: `400 { error: string }`.
  - Server/upsert failure: `500 { error: string }`.

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const fullName = String(body?.full_name || '').trim()
    const phone = String(body?.phone || '').replace(/\D/g, '')
    const cpf = String(body?.cpf || '').replace(/\D/g, '')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'A senha deve ter 8+ caracteres, com letra maiúscula, número e símbolo.' },
        { status: 400 },
      )
    }
    if (fullName.length < 3) {
      return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível.' }, { status: 500 })
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        cpf,
      },
    })

    if (error) {
      const msg = String(error.message || '')
      if (msg.toLowerCase().includes('already been registered') || msg.toLowerCase().includes('already registered')) {
        return NextResponse.json({ error: 'email_exists' }, { status: 409 })
      }
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    if (data?.user) {
      void sendWelcomeEmail({
        userEmail: email,
        userName: fullName,
      }).catch((err) => console.error('[signup-publish] welcome email failed', err))
    }

    return NextResponse.json({ ok: true, email })
  } catch (e) {
    console.error('POST /api/auth/signup-publish failed', e)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/signup-publish/route.ts
git commit -m "feat: signup-publish route creates confirmed account via service role"
```

---

### Task 2: Shared plate-cache helpers

**Files:**
- Modify: `src/lib/integrations/placaapi/client.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `export const PLATE_CACHE_KEY = 'carbi_plate_lookup_v1'` used by `PlateBannerLookup` (writer) and `ListingForm` (reader). Also `export function savePlateLookup(data: PlacaApiResponse)` and `export function readPlateLookup(): PlacaApiResponse | null` (reads and removes the key). Uses `PlacaApiResponse` from `./types`.

- [ ] **Step 1: Add the helpers**

Append to `src/lib/integrations/placaapi/client.ts`:

```ts
import type { PlacaApiResponse } from './types'

export const PLATE_CACHE_KEY = 'carbi_plate_lookup_v1'

export function savePlateLookup(data: PlacaApiResponse): void {
  try {
    sessionStorage.setItem(PLATE_CACHE_KEY, JSON.stringify(data))
  } catch {
    // sessionStorage unavailable (SSR/privacy mode) — ignore
  }
}

export function readPlateLookup(): PlacaApiResponse | null {
  try {
    const raw = sessionStorage.getItem(PLATE_CACHE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(PLATE_CACHE_KEY)
    return JSON.parse(raw) as PlacaApiResponse
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/integrations/placaapi/client.ts
git commit -m "feat: shared plate lookup sessionStorage helpers"
```

---

### Task 3: `PlateBannerLookup` component

**Files:**
- Create: `src/components/marketplace/PlateBannerLookup.tsx`
- Modify: `src/app/page.tsx:206-216` (promo banner)
- Modify: `src/app/globals.css` (append promo lookup styles near `.fingen-promo-btn`, line ~6843)

**Interfaces:**
- Consumes: `lookupPlateClient` (`src/lib/integrations/placaapi/client.ts`), `savePlateLookup` (Task 2), `formatBRL` (`src/data/cars`), design tokens.
- Produces: Self-contained card. On plate found: saves `PlacaApiResponse` via `savePlateLookup`, then `router.push('/anunciar-carro/fluxo?placa=<PLATE>')`.

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, AlertCircle, Check, TrendingUp, Car } from 'lucide-react'
import { lookupPlateClient, savePlateLookup } from '@/lib/integrations/placaapi/client'
import { formatBRL } from '@/data/cars'

export default function PlateBannerLookup() {
  const router = useRouter()
  const [plate, setPlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [found, setFound] = useState<{
    brand: string
    model: string
    year: number
    yearModel?: number
    fipePrice?: number | null
  } | null>(null)

  const formatPlate = (v: string) => v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7)

  const handleLookup = async () => {
    if (plate.length < 7) { setError('A placa deve conter 7 caracteres'); return }
    setLoading(true); setError(null); setFound(null)
    try {
      const data = await lookupPlateClient(plate)
      savePlateLookup(data)
      setFound({
        brand: data.marca,
        model: data.modelo,
        year: data.anoFabricacao,
        yearModel: data.anoModelo,
        fipePrice: data.fipe_price,
      })
      router.push(`/anunciar-carro/fluxo?placa=${encodeURIComponent(data.placa || plate)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar placa. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="promo-plate">
      <div className="promo-plate-row">
        <div className="promo-plate-input-wrap">
          <Car className="promo-plate-input-icon" size={16} />
          <input
            type="text"
            value={plate}
            onChange={(e) => { setPlate(formatPlate(e.target.value)); setError(null); setFound(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !loading && plate.length === 7) handleLookup() }}
            placeholder="Digite a placa (ABC1D23)"
            maxLength={7}
            disabled={loading}
            aria-label="Placa do veículo"
            className="promo-plate-input"
          />
        </div>
        <button type="button" onClick={handleLookup} disabled={loading || plate.length < 7} className="promo-plate-btn">
          {loading ? <Loader2 className="promo-plate-btn-spin" size={16} /> : <Search size={16} />}
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error ? (
        <p className="promo-plate-error"><AlertCircle size={14} />{error}</p>
      ) : null}

      {found ? (
        <p className="promo-plate-found">
          <Check size={14} />
          {found.brand} {found.model} {found.year}
          {found.yearModel && found.yearModel !== found.year ? `/${found.yearModel}` : ''}
          {found.fipePrice != null && found.fipePrice > 0 ? ` • FIPE ${formatBRL(found.fipePrice)}` : ''}
        </p>
      ) : null}

      <p className="promo-plate-note">A placa é usada apenas para preencher os dados do veículo e não será publicada.</p>
    </div>
  )
}
```

- [ ] **Step 2: Replace the promo banner JSX in `src/app/page.tsx`**

Replace the whole `<section className="fingen-banner fingen-promo-banner">…</section>` block (lines 206-216) with:

```tsx
<section className="fingen-banner fingen-promo-banner">
  <div className="fingen-banner-content fingen-promo-content fingen-promo-column">
    <div className="fingen-promo-top">
      <div className="fingen-banner-text">
        <strong>Anuncie grátis por tempo limitado</strong>
        <span>Publique seu carro sem custo e alcance milhares de compradores.</span>
      </div>
      <Link href="/anunciar-carro/fluxo" className="fingen-banner-btn fingen-promo-btn">
        Começar agora
      </Link>
    </div>
    <PlateBannerLookup />
  </div>
</section>
```

Add the import at the top of `src/app/page.tsx` (near the other component imports):

```tsx
import PlateBannerLookup from '@/components/marketplace/PlateBannerLookup'
```

- [ ] **Step 3: Append styles to `src/app/globals.css`**

Append after the `.fingen-promo-btn:hover` block (line ~6843):

```css
/* ━━━ Promo Banner — Plate Lookup ━━━ */
.fingen-promo-column {
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}

.fingen-promo-top {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.promo-plate {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 560px;
}

.promo-plate-row {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.promo-plate-input-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.promo-plate-input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

.promo-plate-input {
  width: 100%;
  height: 44px;
  padding: 0 12px 0 38px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: var(--font-mono, ui-monospace, monospace);
  outline: none;
  transition: all 0.15s ease;
}

.promo-plate-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
  text-transform: none;
  letter-spacing: 0;
  font-weight: 400;
}

.promo-plate-input:focus {
  border-color: #D4F576;
  box-shadow: 0 0 0 3px rgba(212, 245, 118, 0.25);
}

.promo-plate-btn {
  flex-shrink: 0;
  height: 44px;
  padding: 0 18px;
  border-radius: 14px;
  background: #D4F576;
  color: #1A1A1A;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.promo-plate-btn:hover { background: #C8E64E; }
.promo-plate-btn:active { transform: scale(0.96); }
.promo-plate-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.promo-plate-btn-spin { animation: spin 0.8s linear infinite; }

.promo-plate-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #FFB4A0;
}

.promo-plate-found {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #D4F576;
}

.promo-plate-note {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/marketplace/PlateBannerLookup.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat: plate lookup field in home promo banner"
```

---

### Task 4: `/anunciar-carro` page no longer forces login

**Files:**
- Modify: `src/app/anunciar-carro/page.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: always redirects to `/anunciar-carro/fluxo`.

- [ ] **Step 1: Replace the auth-check effect**

Replace the whole `useEffect` body (lines 10-28) and simplify the page to always go to the flow:

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnunciarCarroPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/anunciar-carro/fluxo')
  }, [router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'var(--color-text-secondary)' }}>Verificando autenticação...</p>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/anunciar-carro/page.tsx
git commit -m "refactor: anunciar-carro always goes to the flow (no login gate)"
```

---

### Task 5: `ListingForm` — remove gate, prefill from plate, account form in final step

**Files:**
- Modify: `src/components/marketplace/ListingForm.tsx`

**Interfaces:**
- Consumes: `readPlateLookup` (Task 2), `lookupPlateClient` (for programmatic lookup fallback), `AuthCard` no longer used here.
- Produces: step-3 account fields state `account` and helper `validateAccount()`, plus inline email-exists UI.

- [ ] **Step 1: Add imports and account state**

At the top of `ListingForm.tsx`, add to the existing import from `@/lib/integrations/placaapi/client`:

```tsx
import { lookupPlateClient, readPlateLookup } from '@/lib/integrations/placaapi/client'
```

After the `INITIAL_STATE` const, add the account form default and helper validators:

```tsx
const ACCOUNT_INITIAL = { name: '', phone: '', cpf: '', email: '', password: '', confirmPassword: '' }

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.length <= 10
    ? d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

function isValidCPF(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i)
  let r = (s * 10) % 11
  if (r === 10) r = 0
  if (r !== parseInt(d[9])) return false
  s = 0
  for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i)
  r = (s * 10) % 11
  if (r === 10) r = 0
  return r === parseInt(d[10])
}
```

- [ ] **Step 2: Add account state + plate prefill effect**

Inside the `ListingForm` component body, after the existing `const [success, setSuccess] = useState<string | null>(null)` line, add:

```tsx
const [account, setAccount] = useState(ACCOUNT_INITIAL)
const [accountEmailExists, setAccountEmailExists] = useState(false)
```

Add a prefill effect after the existing DRAFT_KEY restore effect (line ~277):

```tsx
useEffect(() => {
  const plate = new URLSearchParams(window.location.search).get('placa')
  const cached = readPlateLookup()
  if (!plate || !cached) return
  try {
    localStorage.removeItem(DRAFT_KEY)
    setForm((prev) => ({
      ...prev,
      brand: cached.marca,
      model: cached.modelo,
      version: cached.versao || prev.version,
      year: cached.anoFabricacao ? String(cached.anoFabricacao) : prev.year,
      yearModel: (cached.anoModelo || cached.anoFabricacao) ? String(cached.anoModelo || cached.anoFabricacao) : prev.yearModel,
      color: cached.cor,
      fuel: cached.combustivel || prev.fuel,
      engine: cached.cilindradas || prev.engine,
      horsepower: cached.potencia || prev.horsepower,
      transmission: cached.cambio || 'Automático',
      bodyType: cached.tipoVeiculo || prev.bodyType,
      plateFinal: cached.placa || plate,
    }))
    setListingSubStep(2)
  } catch {
    // ignore malformed cache
  }
}, [])
```

- [ ] **Step 3: Remove the login gate**

Replace the `if (!isAuthenticated) { return <AuthCard ... /> }` block (lines 965-971) with nothing (delete it). `AuthCard` import becomes unused — remove it from imports (`import AuthCard from '@/components/marketplace/AuthCard'`).

- [ ] **Step 4: Add account validation helper + email-exists reset**

Inside the component, near `validateStep`, add:

```tsx
const validateAccount = (): string | null => {
  if (account.name.trim().length < 3) return 'Informe seu nome completo.'
  if (account.phone.replace(/\D/g, '').length < 10) return 'Informe um telefone válido.'
  if (!isValidCPF(account.cpf)) return 'Informe um CPF válido.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email.trim())) return 'Informe um e-mail válido.'
  if (
    account.password.length < 8 ||
    !/[A-Z]/.test(account.password) ||
    !/\d/.test(account.password) ||
    !/[^A-Za-z0-9]/.test(account.password)
  ) return 'A senha deve ter 8+ caracteres, com letra maiúscula, número e símbolo.'
  if (account.password !== account.confirmPassword) return 'As senhas não coincidem.'
  return null
}
```

In the `handleInput`-adjacent area (after the `handleSubmit` definition), add a reset so changing email clears the exists flag:

```tsx
const handleAccountInput = (field: keyof typeof ACCOUNT_INITIAL, value: string) => {
  setAccount((prev) => ({ ...prev, [field]: value }))
  if (field === 'email') setAccountEmailExists(false)
}
```

- [ ] **Step 5: Extend `handleSubmit` to create account + sign in when not authenticated**

Inside `handleSubmit`, at the top of the `try` block (before `const supabase = getSupabaseBrowserClient()`), insert:

```tsx
if (!isAuthenticated) {
  const accountError = validateAccount()
  if (accountError) { setError(accountError); return }
  const signupRes = await fetch('/api/auth/signup-publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: account.email.trim().toLowerCase(),
      password: account.password,
      full_name: account.name.trim(),
      phone: account.phone.replace(/\D/g, ''),
      cpf: account.cpf.replace(/\D/g, ''),
    }),
  })
  if (signupRes.status === 409) {
    setAccountEmailExists(true)
    setError('Este e-mail já está cadastrado. Faça login para publicar seu anúncio.')
    return
  }
  if (!signupRes.ok) {
    const body = await signupRes.json().catch(() => ({}))
    setError(body?.error || 'Não foi possível criar sua conta.')
    return
  }
  const supabaseLocal = getSupabaseBrowserClient()
  const { error: signInError } = await supabaseLocal.auth.signInWithPassword({
    email: account.email.trim().toLowerCase(),
    password: account.password,
  })
  if (signInError) {
    setError('Conta criada, mas não foi possível entrar automaticamente. Faça login para publicar.')
    return
  }
}
```

Note: keep the existing `const supabase = getSupabaseBrowserClient()` line after this block so the publish flow uses the now-valid session.

- [ ] **Step 6: Render account form + email-exists message in step 3**

Inside the `currentStep === 3` block, after the security-note div (line ~1364, before the closing `</div>` of step 3), insert:

```tsx
{!isAuthenticated ? (
  <div className="fingen-flow-substep-card p-4 sm:p-6 space-y-4 mt-10">
    <div className="space-y-1">
      <p className="fingen-flow-field-label text-base">Crie sua conta para publicar</p>
      <p className="text-[13px] text-[#767676]">Seus dados do anúncio são guardados e a publicação é imediata.</p>
    </div>

    {accountEmailExists ? (
      <div className="rounded-xl p-4 bg-[#FEF2F2] border border-[#FECACA] space-y-3">
        <p className="text-sm text-[#B91C1C] font-medium">
          Este e-mail já está cadastrado. Entre na sua conta para publicar.
        </p>
        <Link
          href="/entrar?redirect=/anunciar-carro/fluxo"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1A1A1A] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#2D2D2D]"
        >
          Entrar na minha conta
        </Link>
      </div>
    ) : (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-[10px] font-medium text-[#767676]" htmlFor="account-name">Nome completo</label>
          <input
            id="account-name"
            className="fingen-flow-input mt-1"
            placeholder="Seu nome completo"
            value={account.name}
            onChange={(e) => handleAccountInput('name', e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-[#767676]" htmlFor="account-phone">Telefone</label>
          <input
            id="account-phone"
            className="fingen-flow-input mt-1"
            placeholder="(00) 00000-0000"
            inputMode="tel"
            value={account.phone}
            onChange={(e) => handleAccountInput('phone', formatPhone(e.target.value))}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-[#767676]" htmlFor="account-cpf">CPF</label>
          <input
            id="account-cpf"
            className="fingen-flow-input mt-1"
            placeholder="000.000.000-00"
            maxLength={14}
            value={account.cpf}
            onChange={(e) => handleAccountInput('cpf', formatCPF(e.target.value))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-medium text-[#767676]" htmlFor="account-email">E-mail</label>
          <input
            id="account-email"
            type="email"
            className="fingen-flow-input mt-1"
            placeholder="voce@email.com"
            value={account.email}
            onChange={(e) => handleAccountInput('email', e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-[#767676]" htmlFor="account-password">Senha</label>
          <input
            id="account-password"
            type="password"
            className="fingen-flow-input mt-1"
            placeholder="Crie uma senha"
            value={account.password}
            onChange={(e) => handleAccountInput('password', e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-[#767676]" htmlFor="account-confirm">Confirmar senha</label>
          <input
            id="account-confirm"
            type="password"
            className="fingen-flow-input mt-1"
            placeholder="Repita a senha"
            value={account.confirmPassword}
            onChange={(e) => handleAccountInput('confirmPassword', e.target.value)}
          />
        </div>
      </div>
    )}
  </div>
) : null}
```

- [ ] **Step 7: Update the step-3 button label**

In the footer buttons (`currentStep === 3 ? 'Publicar anúncio' : ...`, line ~1421) and the mobile sticky button (line ~1447), change the label conditionally:

```tsx
currentStep === 3 ? (!isAuthenticated ? 'Criar conta e publicar' : 'Publicar anúncio') : ...
```

Both occurrences must change.

- [ ] **Step 8: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/marketplace/ListingForm.tsx
git commit -m "feat: remove login gate and add account creation in final listing step"
```

---

### Task 6: End-to-end verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Verify plate lookup API locally**

Run: `npm run dev`, then open the home page. Type a plate in the promo card, press Enter.
Expected: vehicle name/year/FIPE appears, then redirect to `/anunciar-carro/fluxo?placa=XXX` with the vehicle data pre-filled in the "Dados do veículo" confirm sub-step.

- [ ] **Step 2: Verify logged-out publish flow**

Without being logged in, complete steps 2-3 (price, photos, description) and click **"Criar conta e publicar"**.
Expected: a confirmed account is created (email receives the welcome email), the listing is created, images upload, and the user is redirected to the listing slug.

- [ ] **Step 3: Verify duplicate-email flow**

Repeat with an already-registered email (e.g. `contatorbx@gmail.com`).
Expected: message "Este e-mail já está cadastrado..." + button "Entrar na minha conta" pointing to `/entrar?redirect=/anunciar-carro/fluxo`.

- [ ] **Step 4: Verify logged-in flow unchanged**

Log in first, then go to `/anunciar-carro/fluxo`.
Expected: final step shows no account form; button reads "Publicar anúncio".

- [ ] **Step 5: Full build + lint + commit**

Run: `npx tsc --noEmit && npm run build`
Run: `npm run lint`
Then commit any remaining staged changes:

```bash
git add -A
git commit -m "chore: verify plate-to-listing flow end to end"
git push origin main
```

Expected: deploy on Vercel reaches READY.
