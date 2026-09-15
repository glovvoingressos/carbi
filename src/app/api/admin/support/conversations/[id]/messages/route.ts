import { NextRequest, NextResponse } from 'next/server'

import { SupportAdminAuthorizationError, requireSupportAdmin } from '../../../../../../../lib/support-admin'
import { getSupabaseAdminClient } from '../../../../../../../lib/supabase-server'
import { validateSupportMessage } from '../../../../../../../lib/support-validation'

export const dynamic = 'force-dynamic'

const MESSAGE_FIELDS = 'id, conversation_id, sender_type, sender_name, body, created_at'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const admin = await authorize(request)
  if (admin instanceof NextResponse) return admin

  const id = await readConversationId(context)
  if (!id) return invalidConversationId()

  const body = await request.json().catch(() => null)
  const validation = validateSupportMessage({ message: body?.message })
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

  const supabase = getSupabaseAdminClient()
  if (!supabase) return unavailable()

  const { data: message, error } = await supabase
    .from('support_messages')
    .insert({
      conversation_id: id,
      sender_type: 'admin',
      sender_name: admin.email,
      body: validation.value.message,
    })
    .select(MESSAGE_FIELDS)
    .single()
  if (error || !message) return unavailable()

  const { error: activityError } = await supabase
    .from('support_conversations')
    .update({ status: 'waiting_visitor', last_message_at: new Date().toISOString() })
    .eq('id', id)
  if (activityError) {
    console.error('[support-admin] persisted reply but activity reconciliation failed', { conversationId: id })
  }

  return NextResponse.json({ message }, { status: 201 })
}

async function readConversationId(context: RouteContext): Promise<string | undefined> {
  const { id } = await context.params
  const normalized = typeof id === 'string' ? id.trim() : ''
  return UUID_PATTERN.test(normalized) ? normalized : undefined
}

async function authorize(
  request: NextRequest,
): Promise<{ userId: string; email: string } | NextResponse> {
  try {
    return await requireSupportAdmin(request)
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

function unavailable() {
  return NextResponse.json({ error: 'Support service is temporarily unavailable.' }, { status: 503 })
}
