import { NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export interface AuthContext {
  userId: string
  accessToken: string
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const authorization = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
    return null
  }

  const accessToken = authorization.slice(7).trim()
  if (!accessToken) return null

  const supabase = getSupabaseServerClient(accessToken)
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) return null

  return {
    userId: data.user.id,
    accessToken,
  }
}
