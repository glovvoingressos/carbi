# Marketplace em Produção (Supabase)

## 1. Aplicar schema
Rode o SQL em [`supabase/migrations/20260409_vehicle_marketplace.sql`](../supabase/migrations/20260409_vehicle_marketplace.sql) no projeto Supabase de produção.

Esse script cria:
- tabelas: `vehicle_listings`, `vehicle_listing_images`, `conversations`, `conversation_messages`, `conversation_reads`
- view pública: `vehicle_listings_public`
- índices e triggers (`updated_at`, cálculo FIPE, última mensagem)
- policies RLS para anúncios, imagens e chat
- bucket `vehicle-listings` + policies de upload/leitura

## 2. Variáveis de ambiente
Defina no ambiente do app:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `FIPE_API_TOKEN`
- `NEXT_PUBLIC_FIPE_API_BASE_URL` (já usa `https://fipe.parallelum.com.br/api/v2` por padrão)

## 3. Fluxos implementados
- Publicar anúncio real com FIPE + upload real de até 10 fotos:
  - `/anunciar-carro-bh`
- Página pública de anúncio com comparação FIPE e chat interno:
  - `/anuncios/[slug]`
- Chat interno comprador/anunciante:
  - `/minha-conta/conversas`
- Seção de anúncios reais relacionados na página de veículo:
  - `/[brand]/[model]`

## 4. Rotas backend implementadas
- `POST/GET /api/marketplace/listings`
- `GET /api/marketplace/listings/[identifier]`
- `POST /api/marketplace/listings/[listingId]/images`
- `POST /api/marketplace/listings/[listingId]/conversation`
- `GET /api/marketplace/conversations`
- `GET/POST /api/marketplace/conversations/[conversationId]/messages`
- `POST /api/marketplace/conversations/[conversationId]/read`
