'use client'

import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

let cachedClient: ReturnType<typeof createBrowserClient> | null = null
let cachedRecoveryClient: ReturnType<typeof createClient> | null = null

export function isSupabaseBrowserConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function getSupabaseBrowserClient() {
  if (cachedClient) return cachedClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return cachedClient
}

/**
 * Password recovery links may be opened by a different browser context than
 * the one that requested them. Use the implicit flow here so recovery does
 * not depend on a PKCE verifier stored in the original context.
 */
export function getSupabaseRecoveryClient() {
  if (cachedRecoveryClient) return cachedRecoveryClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  cachedRecoveryClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'implicit',
      detectSessionInUrl: false,
      autoRefreshToken: true,
      persistSession: true,
    },
  })

  return cachedRecoveryClient
}
