import { getSupabaseAdminClient } from './supabase-server'
import { hashVisitorToken, VISITOR_COOKIE_OPTIONS } from './support-security'
import type { ValidSupportMessage } from './support-validation'

export type SupportConversation = {
  id: string
  visitor_token_hash: string
  visitor_name: string | null
  visitor_email: string | null
  status: 'open' | 'waiting_visitor' | 'closed'
  last_message_at: string
  created_at: string
  updated_at: string
}

export type SupportMessage = {
  id: string
  conversation_id: string
  sender_type: 'visitor' | 'admin'
  sender_name: string | null
  body: string
  created_at: string
}

export type SupportConversationWithMessages = SupportConversation & {
  messages: SupportMessage[]
}

export class SupportServiceError extends Error {
  constructor(public readonly code: 'not_found' | 'unavailable') {
    super(code === 'not_found' ? 'Support conversation not found.' : 'Support service unavailable.')
  }
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 12
const rateLimitEntries = new Map<string, { count: number; resetAt: number }>()

export function getVisitorCookieOptions() {
  return VISITOR_COOKIE_OPTIONS
}

export function checkSupportRateLimit(ip: string, visitorToken: string): boolean {
  const now = Date.now()
  const key = `${ip}:${visitorToken}`
  const entry = rateLimitEntries.get(key)

  if (!entry || entry.resetAt <= now) {
    if (rateLimitEntries.size >= 5_000) {
      for (const [entryKey, value] of rateLimitEntries) {
        if (value.resetAt <= now) rateLimitEntries.delete(entryKey)
      }
      while (rateLimitEntries.size >= 5_000) {
        const oldestKey = rateLimitEntries.keys().next().value
        if (!oldestKey) break
        rateLimitEntries.delete(oldestKey)
      }
    }
    rateLimitEntries.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false
  entry.count += 1
  return true
}

export async function createConversationMessage(
  input: ValidSupportMessage,
  visitorToken: string,
): Promise<SupportConversation> {
  const supabase = requireAdminClient()
  const visitorTokenHash = await hashVisitorToken(visitorToken)
  const { data: existing, error: findError } = await supabase
    .from('support_conversations')
    .select('*')
    .eq('visitor_token_hash', visitorTokenHash)
    .maybeSingle()

  if (findError) throw unavailable()

  let conversation = existing as SupportConversation | null
  if (!conversation) {
    const { data, error } = await supabase
      .from('support_conversations')
      .insert({
        visitor_token_hash: visitorTokenHash,
        visitor_name: input.name ?? null,
        visitor_email: input.email ?? null,
      })
      .select('*')
      .single()
    if (error || !data) throw unavailable()
    conversation = data as SupportConversation
  }

  await insertVisitorMessage(supabase, conversation.id, input)
  await updateVisitorActivity(supabase, conversation.id)
  return { ...conversation, status: 'open' }
}

export async function listVisitorConversation(
  visitorToken: string,
): Promise<SupportConversationWithMessages | null> {
  const supabase = requireAdminClient()
  const visitorTokenHash = await hashVisitorToken(visitorToken)
  const { data: conversation, error } = await supabase
    .from('support_conversations')
    .select('*')
    .eq('visitor_token_hash', visitorTokenHash)
    .maybeSingle()
  if (error) throw unavailable()
  if (!conversation) return null

  const { data: messages, error: messagesError } = await supabase
    .from('support_messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })
  if (messagesError) throw unavailable()

  return { ...(conversation as SupportConversation), messages: (messages ?? []) as SupportMessage[] }
}

export async function appendVisitorMessage(
  conversationId: string,
  visitorToken: string,
  input: ValidSupportMessage,
): Promise<SupportMessage> {
  const supabase = requireAdminClient()
  const visitorTokenHash = await hashVisitorToken(visitorToken)
  const { data: conversation, error } = await supabase
    .from('support_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('visitor_token_hash', visitorTokenHash)
    .maybeSingle()
  if (error) throw unavailable()
  if (!conversation) throw new SupportServiceError('not_found')

  const message = await insertVisitorMessage(supabase, conversationId, input)
  await updateVisitorActivity(supabase, conversationId)
  return message
}

function requireAdminClient() {
  const client = getSupabaseAdminClient()
  if (!client) throw unavailable()
  return client
}

function unavailable() {
  return new SupportServiceError('unavailable')
}

async function insertVisitorMessage(
  supabase: ReturnType<typeof requireAdminClient>,
  conversationId: string,
  input: ValidSupportMessage,
): Promise<SupportMessage> {
  const { data, error } = await supabase
    .from('support_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'visitor',
      sender_name: input.name ?? null,
      body: input.message,
    })
    .select('*')
    .single()
  if (error || !data) throw unavailable()
  return data as SupportMessage
}

async function updateVisitorActivity(
  supabase: ReturnType<typeof requireAdminClient>,
  conversationId: string,
) {
  const { error } = await supabase
    .from('support_conversations')
    .update({ status: 'open', last_message_at: new Date().toISOString() })
    .eq('id', conversationId)
  if (error) throw unavailable()
}
