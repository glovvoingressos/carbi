import { NextRequest, NextResponse } from 'next/server'

import {
  checkSupportRateLimit,
  createConversationMessage,
  getVisitorCookieOptions,
  listVisitorConversation,
  SupportServiceError,
} from '../../../../lib/support-service'
import { getOrCreateVisitorToken, VISITOR_TOKEN_COOKIE } from '../../../../lib/support-security'
import { validateSupportMessage } from '../../../../lib/support-validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const visitorToken = readVisitorToken(request)
  if (!visitorToken) return NextResponse.json({ conversation: null })

  try {
    const conversation = await listVisitorConversation(visitorToken)
    return NextResponse.json({ conversation: toPublicConversation(conversation) })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => null)
  const validation = validateSupportMessage(input ?? {})
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

  const { token, setCookie } = getOrCreateVisitorToken(request)
  if (!checkSupportRateLimit(clientIp(request), token)) {
    return NextResponse.json({ error: 'Too many support messages. Please try again shortly.' }, { status: 429 })
  }

  try {
    const conversation = await createConversationMessage(validation.value, token)
    const response = NextResponse.json({ conversation: toPublicConversation(conversation) }, { status: 201 })
    if (setCookie) response.cookies.set(VISITOR_TOKEN_COOKIE, token, getVisitorCookieOptions())
    return response
  } catch (error) {
    return serviceErrorResponse(error)
  }
}

function readVisitorToken(request: NextRequest): string | undefined {
  const cookieRequest = request as NextRequest & { cookies?: { get(name: string): { value: string } | undefined } }
  return cookieRequest.cookies?.get(VISITOR_TOKEN_COOKIE)?.value
    ?? request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${VISITOR_TOKEN_COOKIE}=`))?.slice(VISITOR_TOKEN_COOKIE.length + 1)
}

function clientIp(request: NextRequest): string {
  const platformRequest = request as NextRequest & { ip?: string }
  return platformRequest.ip?.trim() || 'unknown'
}

function toPublicConversation<T extends { visitor_token_hash?: unknown }>(conversation: T | null) {
  if (!conversation) return null
  const { visitor_token_hash: _visitorTokenHash, ...publicConversation } = conversation
  return publicConversation
}

function serviceErrorResponse(error: unknown) {
  if (error instanceof SupportServiceError && error.code === 'not_found') {
    return NextResponse.json({ error: 'Support conversation not found.' }, { status: 404 })
  }
  return NextResponse.json({ error: 'Support service is temporarily unavailable.' }, { status: 503 })
}
