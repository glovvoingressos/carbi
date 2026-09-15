import { NextRequest } from 'next/server'

import { getAuthContext } from './auth-server'
import { getSupabaseServerClient } from './supabase-server'

export class SupportAdminAuthorizationError extends Error {
  constructor() {
    super('Support admin authorization is required.')
  }
}

export function getSupportAdminEmails(): Set<string> {
  const configured = normalizeEmailList(process.env.SUPPORT_ADMIN_EMAILS)
  if (configured.size > 0) return configured

  return normalizeEmailList(process.env.ADMIN_NOTIFY_EMAIL)
}

export async function requireSupportAdmin(
  request: NextRequest,
): Promise<{ userId: string; email: string }> {
  const auth = await getAuthContext(request)
  if (!auth) throw new SupportAdminAuthorizationError()

  const supabase = getSupabaseServerClient(auth.accessToken)
  const { data, error } = await supabase.auth.getUser()
  const email = normalizeEmail(data.user?.email)

  if (error || !email || !getSupportAdminEmails().has(email)) {
    throw new SupportAdminAuthorizationError()
  }

  return { userId: auth.userId, email }
}

function normalizeEmailList(value: string | undefined): Set<string> {
  return new Set((value ?? '')
    .split(',')
    .map(normalizeEmail)
    .filter((email): email is string => Boolean(email)))
}

function normalizeEmail(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase()
  return normalized || undefined
}
