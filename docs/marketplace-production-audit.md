# Marketplace Production Audit Checklist

## Escopo
- Fluxo de anúncio real (create vehicle -> create listing -> upload imagens)
- Gestão de anúncios (listar, editar, status, excluir)
- Chat real entre usuários (conversa + mensagens)
- Auditoria de schema Supabase

## Migrações obrigatórias
Aplicar em ordem:
1. `supabase/migrations/20260409_vehicle_marketplace.sql`
2. `supabase/migrations/20260410_marketplace_production_hardening.sql`

## Entidades garantidas pela migração de hardening
- `public.users`
- `public.vehicles`
- `public.vehicle_images`
- `public.vehicle_listings`
- `public.vehicle_listing_images`
- `public.conversations`
- `public.conversation_messages`
- `public.messages` (view de compatibilidade para auditoria/integrações)

## Endpoints críticos
- `POST /api/marketplace/listings`
- `POST /api/marketplace/listings/[listingId]/images`
- `GET /api/marketplace/my-listings`
- `PATCH /api/marketplace/listings/[listingId]`
- `DELETE /api/marketplace/listings/[listingId]`
- `POST /api/marketplace/listings/[listingId]/conversation`
- `GET/POST /api/marketplace/conversations/[conversationId]/messages`
- `GET /api/marketplace/audit`

## Validação E2E real
Use dois usuários reais do Supabase:

```bash
MARKETPLACE_BASE_URL=https://cardecision-web.vercel.app \
NEXT_PUBLIC_SUPABASE_URL=... \
NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
E2E_USER_A_EMAIL=... \
E2E_USER_A_PASSWORD=... \
E2E_USER_B_EMAIL=... \
E2E_USER_B_PASSWORD=... \
npm run test:marketplace:e2e
```

O script valida:
- login de 2 usuários
- anúncio real
- upload real de imagem no storage
- listagem pública do anúncio
- edição de anúncio
- abertura de conversa por outro usuário
- troca de mensagens
- auditoria de schema via API
