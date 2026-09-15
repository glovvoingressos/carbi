import { NextRequest, NextResponse } from 'next/server'

import { appendVisitorMessage, checkSupportRateLimit, SupportServiceError } from '../../../../../lib/support-service'
import { VISITOR_TOKEN_COOKIE } from '../../../../../lib/support-security'
import { validateSupportMessage } from '../../../../../lib/support-validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const visitorToken = readVisitorToken(request)
  if (!visitorToken) return NextResponse.json({ error: 'Support visitor cookie is required.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const conversationId = typeof body?.conversationId === 'string' ? body.conversationId.trim() : ''
  if (!conversationId) return NextResponse.json({ error: 'Conversation ID is required.' }, { status: 400 })

  const validation = validateSupportMessage(body ?? {})
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })
  if (!checkSupportRateLimit(clientIp(request), visitorToken)) {
    return NextResponse.json({ error: 'Too many support messages. Please try again shortly.' }, { status: 429 })
  }

  try {
    const message = await appendVisitorMessage(conversationId, visitorToken, validation.value)
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof SupportServiceError && error.code === 'not_found') {
      return NextResponse.json({ error: 'Support conversation not found.' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Support service is temporarily unavailable.' }, { status: 503 })
  }
}

function readVisitorToken(request: NextRequest): string | undefined {
  const cookieRequest = request as NextRequest & { cookies?: { get(name: string): { value: string } | undefined } }
  return cookieRequest.cookies?.get(VISITOR_TOKEN_COOKIE)?.value
    ?? request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${VISITOR_TOKEN_COOKIE}=`))?.slice(VISITOR_TOKEN_COOKIE.length + 1)
}

function clientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}
