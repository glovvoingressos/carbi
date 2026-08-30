import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_PROMPT = `Você é um editor de textos especializado em anúncios de veículos usados no Brasil.
Sua única tarefa é reorganizar e melhorar a formatação do texto que o usuário digitou na descrição do anúncio.

Regras obrigatórias:
1. NÃO invente informações, números, palavras, opcionais, acessórios, histórico, revisões ou estados do veículo. Use exclusivamente o que o usuário escreveu.
2. NÃO remova informações que o usuário incluiu.
3. Corrija apenas ortografia e gramática quando estiver claro que é um erro de digitação.
4. Reorganize em parágrafos curtos e legíveis.
5. Use listas quando o usuário listou itens (ex.: "ar gelado, vidros elétricos, direção hidráulica" vira lista com marcadores usando "- ").
6. Separe blocos temáticos com uma linha em branco (use \\n\\n entre parágrafos).
7. Dentro do mesmo parágrafo, use apenas \\n para quebras suaves (ex.: endereço, observações curtas no fim).
8. NÃO use markdown pesado (sem #, sem **). Pode usar "- " no início de linhas de listas.
9. NÃO adicione saudações, propostas de compra, links ou CTAs.
10. NÃO mude o tom do vendedor. Mantenha a voz original (formal, informal, direta, etc.).
11. Responda APENAS com o texto reformatado, sem aspas, sem "Aqui está...", sem comentários.
12. Se o texto estiver vazio ou sem sentido, devolva uma string vazia.`

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY não configurada no servidor.' },
        { status: 500 },
      )
    }

    const body = await request.json().catch(() => null)
    const description = typeof body?.description === 'string' ? body.description : ''
    const trimmed = description.trim()

    if (!trimmed) {
      return NextResponse.json({ formatted: '' })
    }

    if (trimmed.length > 8000) {
      return NextResponse.json(
        { error: 'Descrição muito longa (máx. 8000 caracteres).' },
        { status: 400 },
      )
    }

    const userPrompt = `Reformate a descrição abaixo seguindo as regras. Responda somente com o texto final.

Descrição do anúncio:
"""
${trimmed}
"""`

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://carbi.com.br',
        'X-Title': 'Carbi - Formatador de descrição',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(25000),
    })

    if (!response.ok) {
      const status = response.status
      console.error(`[format-description] OpenRouter error: ${status}`)
      return NextResponse.json(
        { error: `Falha no provedor de IA (${status}).` },
        { status: 502 },
      )
    }

    const data = await response.json()
    const content: string = data?.choices?.[0]?.message?.content?.trim() || ''

    if (!content) {
      return NextResponse.json(
        { error: 'IA retornou resposta vazia.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ formatted: content })
  } catch (error) {
    if ((error as { name?: string })?.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Tempo esgotado ao chamar a IA. Tente novamente.' },
        { status: 504 },
      )
    }
    console.error('[format-description] error', error)
    return NextResponse.json(
      { error: 'Erro inesperado ao formatar a descrição.' },
      { status: 500 },
    )
  }
}