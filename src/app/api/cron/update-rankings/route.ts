import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request) {
  return NextResponse.json({
    error: 'Atualização de rankings desativada: não há uma fonte de dados validada configurada para esta rotina.',
  }, { status: 410 })
}
