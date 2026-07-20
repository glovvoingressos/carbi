# Sistema para Revendas — Fases 1, 2 e 3

## Visão Geral

Implementar suporte a **revendas** (concessionárias/lojistas) na plataforma Carbi, com cadastro em massa de veículos e gestão em lote. O sistema atual é 100% pessoa física.

---

## Fase 1: Perfil Revenda + Dashboard + Página da Revenda

### 1.1 Tipo de Conta

Adicionar campo `account_type` na tabela `users`:

```sql
ALTER TABLE users ADD COLUMN account_type text DEFAULT 'pf' CHECK (account_type IN ('pf', 'revenda'));
```

Na tela de cadastro (`AuthCard.tsx`), após step 1 (nome + CPF), adicionar step opcional:

- "Você é uma revenda?" → Sim / Não
- Se Sim: pedir CNPJ, nome da loja, telefone comercial

Novas colunas na tabela `users`:

```sql
ALTER TABLE users ADD COLUMN cnpj text;
ALTER TABLE users ADD COLUMN store_name text;
ALTER TABLE users ADD COLUMN store_phone text;
ALTER TABLE users ADD COLUMN store_description text;
ALTER TABLE users ADD COLUMN store_address text;
ALTER TABLE users ADD COLUMN store_city text;
ALTER TABLE users ADD COLUMN store_state text;
ALTER TABLE users ADD COLUMN store_website text;
ALTER TABLE users ADD COLUMN store_instagram text;
ALTER TABLE users ADD COLUMN store_whatsapp text;
ALTER TABLE users ADD COLUMN store_logo_url text;
ALTER TABLE users ADD COLUMN store_cover_url text;
ALTER TABLE users ADD COLUMN business_hours jsonb;
```

### 1.2 Dashboard da Revenda

Rota: `/minha-conta/revenda`

Layout estilo Stripe Dashboard:

**Header cards (KPIs):**
- Total de veículos
- Veículos ativos
- Veículos vendidos
- Visualizações totais (soma de `view_count`)
- Leads recebidos (conversas únicas)
- Mensagens não lidas

**Seções:**
1. **Gráfico de visitas** — último mês, usando dados de `listing_views`
2. **Últimos contatos** — 5 conversas mais recentes
3. **Alertas IA** — veículos com poucas fotos, preço acima da FIPE, descrição curta
4. **Ações rápidas** — Cadastrar veículo, Importar planilha

**Componentes:**
- `RevendaDashboard` — page component
- `RevendaKPICard` — card de métrica
- `RevendaVisitChart` — gráfico de visitas (reutilizar AnimatedBarChart)
- `RevendaAlerts` — lista de alertas
- `RevendaRecentContacts` — últimas conversas

### 1.3 Página da Revenda (Pública)

Rota: `/revendas/[slug]`

Exibe:
- Logo + capa
- Nome, endereço, telefone, WhatsApp, Instagram, site
- Horário de funcionamento
- Mapa (Google Maps embed)
- Todos os veículos (com filtros internos)
- Estatísticas: total de veículos, tempo no mercado

**Componentes:**
- `RevendaPublicPage` — página pública
- `RevendaVehicleGrid` — grid de veículos da revenda
- `RevendaInfoCard` — dados de contato

### 1.4 RLS

```sql
-- Revenda só vê seus próprios dados
CREATE POLICY "revenda_own_profile" ON users
  FOR ALL USING (auth.uid() = id);

-- Qualquer um pode ver perfil público de revenda
CREATE POLICY "public_revenda_profile" ON users
  FOR SELECT USING (account_type = 'revenda');
```

---

## Fase 2: Cadastro em Massa

### 2.1 Upload de Planilha

Rota: `/minha-conta/revenda/importar`

**Fluxo:**
1. Usuário faz upload de XLSX ou CSV
2. Sistema detecta colunas automaticamente (fuzzy match)
3. Preview: mostra mapeamento das colunas
4. Usuário confirma ou ajusta mapeamento
5. Preview dos dados (10 primeiras linhas)
6. Importação em background (queue)

**Mapeamento automático de colunas:**

| Coluna na planilha | Campo no banco |
|---|---|
| Marca, Brand, Montadora | brand |
| Modelo, Model | model |
| Ano, Year, Ano Modelo | year_model |
| Versão, Trim, Version | version |
| Preço, Price, Valor | price |
| KM, Quilometragem, Mileage | mileage |
| Cor, Color | color |
| Combustível, Fuel | fuel |
| Câmbio, Transmissão, Gear | transmission |
| Cidade, City | city |
| Estado, State, UF | state |
| Placa, Plate | plate |
| Descrição, Description | description |

**Componentes:**
- `SpreadsheetUpload` — drag & drop de arquivo
- `ColumnMapper` — interface de mapeamento
- `ImportPreview` — preview dos dados
- `ImportProgress` — progresso da importação

**API Route:** `/api/marketplace/import`

**Edge Function:** `import-vehicles` — processa em background

**Tabela de controle:**

```sql
CREATE TABLE import_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  filename text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_rows integer DEFAULT 0,
  processed_rows integer DEFAULT 0,
  success_rows integer DEFAULT 0,
  error_rows integer DEFAULT 0,
  errors jsonb DEFAULT '[]',
  mapping jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

### 2.2 Cadastro Inteligente (Auto-fill)

Ao selecionar marca + modelo + ano, buscar dados do catálogo (`cars` array) e preencher automaticamente:

- Motor, potência, torque, câmbio, consumo, portas, combustível, tração
- Equipamentos (opcional)
- Ficha técnica

**Componente:** `SmartVehicleForm`
- Select de marca → modelo → ano → versão
- Campos auto-preenchidos (editáveis)
- Indicador visual de campos preenchidos por IA

### 2.3 Duplicar Anúncio

Botão em cada veículo: "Duplicar"

Cópia todos os dados, exceto:
- Ano (input)
- Cor (input)
- KM (input)
- Preço (input)

**API:** `POST /api/marketplace/listings/[id]/duplicate`

### 2.4 Preparação para API/DMS

Criar interfaces modulares:

```typescript
// lib/revenda/adapters/types.ts
interface VehicleImportAdapter {
  name: string
  fetchVehicles(credentials: DealerCredentials): Promise<VehicleImportRow[]>
}

interface VehicleImportRow {
  brand: string
  model: string
  year: number
  version?: string
  price: number
  mileage: number
  color?: string
  fuel?: string
  transmission?: string
  city?: string
  state?: string
  plate?: string
  description?: string
  images?: string[]
}

interface DealerCredentials {
  apiUrl: string
  apiKey: string
  dealerId: string
}
```

Adapters futuros (stub):
- `DealerNetAdapter`
- `AutoAvaliarAdapter`
- `DealerSitesAdapter`
- `SyonetAdapter`

---

## Fase 3: Gestão em Lote

### 3.1 Seleção Múltipla

Na listagem de veículos (`/minha-conta/anuncios`):
- Checkbox em cada card
- "Selecionar todos" no header
- Barra de ações aparece ao selecionar

**Barra de ações (sticky bottom):**
- Editar preço
- Editar cidade
- Editar descrição
- Pausar
- Ativar
- Excluir
- Renovar
- Destacar

### 3.2 Edição em Massa

Modal com:
- Campo para alterar (preço, cidade, descrição, status)
- Valor novo
- Preview: "X veículos serão afetados"
- Confirmar

**API:** `PATCH /api/marketplace/listings/bulk`

```typescript
interface BulkUpdatePayload {
  listingIds: string[]
  updates: {
    price?: number
    city?: string
    state?: string
    description?: string
    status?: 'active' | 'paused' | 'sold'
  }
}
```

### 3.3 Exclusão em Massa

Confirm modal com:
- Lista de veículos selecionados
- "Tem certeza? Esta ação não pode ser desfeita."
- Botão vermelho "Excluir X veículos"

**API:** `DELETE /api/marketplace/listings/bulk`

### 3.4 Renovar/Destacar

**Renovar:** Atualiza `created_at` para agora (move para topo)
**Destacar:** Adiciona flag `featured = true` + data de expiração

```sql
ALTER TABLE vehicle_listings ADD COLUMN featured boolean DEFAULT false;
ALTER TABLE vehicle_listings ADD COLUMN featured_until timestamptz;
```

---

## Arquivos a Criar/Modificar

### Novos arquivos:
- `src/app/minha-conta/revenda/page.tsx` — Dashboard revenda
- `src/app/minha-conta/revenda/importar/page.tsx` — Importação
- `src/app/revendas/[slug]/page.tsx` — Página pública
- `src/components/revenda/RevendaDashboard.tsx`
- `src/components/revenda/RevendaKPICard.tsx`
- `src/components/revenda/RevendaAlerts.tsx`
- `src/components/revenda/SpreadsheetUpload.tsx`
- `src/components/revenda/ColumnMapper.tsx`
- `src/components/revenda/ImportPreview.tsx`
- `src/components/revenda/SmartVehicleForm.tsx`
- `src/components/revenda/BulkActionsBar.tsx`
- `src/components/revenda/BulkEditModal.tsx`
- `src/lib/revenda/adapters/types.ts`
- `src/lib/revenda/adapters/spreadsheet.ts`
- `src/lib/revenda/adapters/dealernet-stub.ts`
- `src/lib/revenda/import-service.ts`
- `src/lib/revenda/bulk-service.ts`
- `src/app/api/marketplace/import/route.ts`
- `src/app/api/marketplace/listings/bulk/route.ts`
- `src/app/api/marketplace/listings/[id]/duplicate/route.ts`
- `supabase/migrations/YYYYMMDD_revenda_system.sql`

### Modificar:
- `src/components/marketplace/AuthCard.tsx` — step de revenda
- `src/lib/marketplace-server.ts` — queries revenda
- `src/components/marketplace/VehicleDetailView.tsx` — botão duplicar
- `src/app/minha-conta/anuncios/page.tsx` — seleção múltipla
- `src/app/globals.css` — estilos novos

---

## Estilo Visual

Seguir o design system existente:
- Cards escuros com gradient verde (`#1A1A1A` → `#0D1F12`)
- Accent: `#D4F576`
- Fonte: `var(--font-heading)`
- Bordas: `var(--radius-xl)`
- Referência: card comparativo e card promo da home

---

## Ordem de Implementação

1. **Migração do banco** — novas tabelas e colunas
2. **Auth updates** — step de revenda no AuthCard
3. **Dashboard revenda** — KPIs, gráfico, alertas
4. **Página pública da revenda**
5. **Upload de planilha** — upload, mapeamento, preview
6. **Importação em background** — Edge Function
7. **Cadastro inteligente** — auto-fill do catálogo
8. **Duplicar anúncio**
9. **Gestão em lote** — seleção, edição, exclusão
10. **Interfaces DMS** — adapters modulares
