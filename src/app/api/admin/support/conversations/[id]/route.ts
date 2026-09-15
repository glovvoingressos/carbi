import { NextRequest, NextResponse } from 'next/server'

import { SupportAdminAuthorizationError, requireSupportAdmin } from '../../../../../../lib/support-admin'
import { getSupabaseAdminClient } from '../../../../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

const CONVERSATION_FIELDS = 'id, visitor_name, visitor_email, status, last_message_at, created_at, updated_at'
const MESSAGE_FIELDS = 'id, conversation_id, sender_type, sender_name, body, created_at'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const authorization = await authorize(request)
  if (authorization) return authorization

  const id = await readConversationId(context)
  if (!id) return invalidConversationId()

  const supabase = getSupabaseAdminClient()
  if (!supabase) return unavailable()

  const { data: conversation, error: conversationError } = await supabase
    .from('support_conversations')
    .select(CONVERSATION_FIELDS)
    .eq('id', id)
    .maybeSingle()
  if (conversationError) return unavailable()
  if (!conversation) return notFound()

  const { data: messages, error: messagesError } = await supabase
    .from('support_messages')
    .select(MESSAGE_FIELDS)
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
  if (messagesError) return unavailable()

  return NextResponse.json({ conversation: { ...conversation, messages: messages ?? [] } })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authorization = await authorize(request)
  if (authorization) return authorization

  const id = await readConversationId(context)
  if (!id) return invalidConversationId()

  const body = await request.json().catch(() => null)
  const status = body?.status
  if (status !== 'open' && status !== 'closed') {
    return NextResponse.json({ error: 'Support status must be open or closed.' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) return unavailable()

  const { data: conversation, error } = await supabase
    .from('support_conversations')
    .update({ status })
    .eq('id', id)
    .select(CONVERSATION_FIELDS)
    .maybeSingle()
  if (error) return unavailable()
  if (!conversation) return notFound()

  return NextResponse.json({ conversation })
}

async function readConversationId(context: RouteContext): Promise<string | undefined> {
  const { id } = await context.params
  const normalized = typeof id === 'string' ? id.trim() : ''
  return UUID_PATTERN.test(normalized) ? normalized : undefined
}

async function authorize(request: NextRequest): Promise<NextResponse | undefined> {
  try {
    await requireSupportAdmin(request)
  } catch (error) {
    if (error instanceof SupportAdminAuthorizationError) {
      return NextResponse.json({ error: 'Support admin authorization is required.' }, { status: 401 })
    }
    console.error('[support-admin] authorization failed', error)
    return unavailable()
  }
}

function invalidConversationId() {
  return NextResponse.json({ error: 'Conversation ID is invalid.' }, { status: 400 })
}

function notFound() {
  return NextResponse.json({ error: 'Support conversation not found.' }, { status: 404 })
}

function unavailable() {
  return NextResponse.json({ error: 'Support service is temporarily unavailable.' }, { status: 503 })
}
