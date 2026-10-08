import { NextResponse } from 'next/server'
import { getSupabaseServerClientWithCookies } from '@/lib/supabase-server'
import { sendWelcomeEmailOnce } from '@/lib/welcome-email'

export async function POST() {
  try {
    const supabase = await getSupabaseServerClientWithCookies()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const result = await sendWelcomeEmailOnce({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name as string | undefined,
    })

    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return NextResponse.json({ error: 'Erro ao enviar e-mail' }, { status: 500 })
  }
}
