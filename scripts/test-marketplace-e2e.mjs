#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.MARKETPLACE_BASE_URL || 'http://127.0.0.1:3000'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

const USER_A_EMAIL = process.env.E2E_USER_A_EMAIL
const USER_A_PASSWORD = process.env.E2E_USER_A_PASSWORD
const USER_B_EMAIL = process.env.E2E_USER_B_EMAIL
const USER_B_PASSWORD = process.env.E2E_USER_B_PASSWORD

function assertEnv(name, value) {
  if (!value) {
    throw new Error(`Missing env ${name}`)
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function header(title) {
  console.log(`\n=== ${title} ===`)
}

async function http(method, path, token, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, payload }
}

async function main() {
  assertEnv('SUPABASE_URL', SUPABASE_URL)
  assertEnv('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY)
  assertEnv('E2E_USER_A_EMAIL', USER_A_EMAIL)
  assertEnv('E2E_USER_A_PASSWORD', USER_A_PASSWORD)
  assertEnv('E2E_USER_B_EMAIL', USER_B_EMAIL)
  assertEnv('E2E_USER_B_PASSWORD', USER_B_PASSWORD)

  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  header('Login users')
  const { data: authA, error: authAError } = await clientA.auth.signInWithPassword({
    email: USER_A_EMAIL,
    password: USER_A_PASSWORD,
  })
  if (authAError || !authA.session) throw new Error(`User A login failed: ${authAError?.message || 'no session'}`)

  const { data: authB, error: authBError } = await clientB.auth.signInWithPassword({
    email: USER_B_EMAIL,
    password: USER_B_PASSWORD,
  })
  if (authBError || !authB.session) throw new Error(`User B login failed: ${authBError?.message || 'no session'}`)
  console.log('OK: both users authenticated')

  header('Create listing (real)')
  const stamp = Date.now()
  const createBody = {
    title: `Anúncio E2E ${stamp}`,
    description: 'Veículo em ótimo estado para teste E2E real de marketplace com Supabase.',
    brand: 'Volkswagen',
    model: 'Polo',
    version: '1.0 TSI',
    year: 2024,
    year_model: 2025,
    mileage: 12345,
    price: 99999,
    transmission: 'Automático',
    fuel: 'Flex',
    color: 'Prata',
    body_type: 'Hatch',
    city: 'Belo Horizonte',
    state: 'MG',
    optional_items: ['Ar digital', 'Multimídia'],
    engine: '1.0 Turbo',
    horsepower: 116,
    plate_final: '5',
    doors: 4,
  }
  const create = await http('POST', '/api/marketplace/listings', authA.session.access_token, createBody)
  if (!create.ok) throw new Error(`Create listing failed (${create.status}): ${JSON.stringify(create.payload)}`)
  const listingId = create.payload.id
  const listingSlug = create.payload.slug
  console.log(`OK: listing created -> ${listingId}`)

  header('Upload listing images (real storage + DB)')
  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z7R0AAAAASUVORK5CYII=',
    'base64',
  )
  const storagePath = `${authA.session.user.id}/${listingId}/01-e2e-${stamp}.png`
  const { error: uploadError } = await clientA.storage
    .from('vehicle-listings')
    .upload(storagePath, tinyPng, { contentType: 'image/png', upsert: true })
  if (uploadError) throw new Error(`Upload image failed: ${uploadError.message}`)

  const { data: publicUrlData } = clientA.storage.from('vehicle-listings').getPublicUrl(storagePath)
  const imagePayload = {
    images: [
      {
        storage_path: storagePath,
        public_url: publicUrlData.publicUrl,
        sort_order: 0,
        is_primary: true,
      },
    ],
  }
  const saveImages = await http(
    'POST',
    `/api/marketplace/listings/${listingId}/images`,
    authA.session.access_token,
    imagePayload,
  )
  if (!saveImages.ok) throw new Error(`Save listing images failed: ${JSON.stringify(saveImages.payload)}`)
  console.log('OK: listing images persisted')

  header('Validate listing appears in public list')
  const listingList = await http('GET', '/api/marketplace/listings?limit=20', null)
  if (!listingList.ok) throw new Error(`Public listings failed: ${JSON.stringify(listingList.payload)}`)
  const foundPublic = Array.isArray(listingList.payload) && listingList.payload.some((item) => item.id === listingId)
  if (!foundPublic) throw new Error('Created listing not found in public listings')
  console.log('OK: listing visible in /api/marketplace/listings')

  header('Edit listing (price + status)')
  const patch = await http('PATCH', `/api/marketplace/listings/${listingId}`, authA.session.access_token, {
    price: 97999,
    status: 'active',
    description: 'Descrição atualizada no teste E2E com persistência real.',
    title: `Anúncio E2E ${stamp} atualizado`,
  })
  if (!patch.ok) throw new Error(`Patch listing failed: ${JSON.stringify(patch.payload)}`)
  console.log('OK: listing patch persisted')

  header('Start chat from another user')
  const startConversation = await http(
    'POST',
    `/api/marketplace/listings/${listingId}/conversation`,
    authB.session.access_token,
    { firstMessage: 'Olá! Ainda está disponível?' },
  )
  if (!startConversation.ok) throw new Error(`Start conversation failed: ${JSON.stringify(startConversation.payload)}`)
  const conversationId = startConversation.payload.conversationId
  console.log(`OK: conversation created -> ${conversationId}`)

  header('Exchange messages')
  const sendByOwner = await http(
    'POST',
    `/api/marketplace/conversations/${conversationId}/messages`,
    authA.session.access_token,
    { message: 'Sim, ainda está disponível.' },
  )
  if (!sendByOwner.ok) throw new Error(`Owner message failed: ${JSON.stringify(sendByOwner.payload)}`)

  await sleep(300)

  const messagesBuyer = await http(
    'GET',
    `/api/marketplace/conversations/${conversationId}/messages`,
    authB.session.access_token,
  )
  if (!messagesBuyer.ok) throw new Error(`Buyer fetch messages failed: ${JSON.stringify(messagesBuyer.payload)}`)
  if (!Array.isArray(messagesBuyer.payload) || messagesBuyer.payload.length < 2) {
    throw new Error('Expected at least 2 messages in conversation')
  }
  console.log('OK: messages exchanged and readable by both participants')

  header('Audit endpoint')
  const audit = await http('GET', '/api/marketplace/audit', authA.session.access_token)
  if (!audit.ok) throw new Error(`Audit endpoint failed: ${JSON.stringify(audit.payload)}`)
  console.log('OK: marketplace audit endpoint healthy')

  console.log('\nE2E marketplace flow completed successfully.')
  console.log(`Listing created: ${BASE_URL}/anuncios/${listingSlug}`)
}

main().catch((error) => {
  console.error(`E2E failed: ${error.message}`)
  process.exit(1)
})
