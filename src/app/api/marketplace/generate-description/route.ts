import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface CarData {
  brand: string
  model: string
  year: number
  yearModel: number
  color: string
  fuel: string
  engine: string
  horsepower: string
  transmission: string
  bodyType: string
  plate: string
  fipePrice?: number | null
}

async function generateDescription(carData: CarData): Promise<string> {
  const prompt = `Você é um especialista em marketing automotivo e SEO. Gere uma descrição chamativa e vendedora para um anúncio de carro usado.

Dados do veículo:
- Marca: ${carData.brand}
- Modelo: ${carData.model}
- Ano: ${carData.yearModel}
- Cor: ${carData.color}
- Combustível: ${carData.fuel}
- Motor: ${carData.engine}
- Potência: ${carData.horsepower} cv
- Câmbio: ${carData.transmission}
- Tipo: ${carData.bodyType}
${carData.fipePrice ? `- Preço FIPE: R$ ${carData.fipePrice.toLocaleString('pt-BR')}` : ''}

Requisitos:
1. Máximo 3 frases curtas e diretas
2. Destacar 2-3 pontos fortes do veículo
3. Tom amigável e profissional
4. Incluir palavras-chave para SEO (marca, modelo, ano)
5. Começar com uma frase gancho que chame atenção
6. NÃO incluir preço (será exibido separadamente)
7. NÃO incluir km (será exibido separadamente)
8. Responder APENAS com a descrição, sem aspas ou formatação extra

Exemplo de boa descrição:
"O ${carData.model} ${carData.yearModel} combina economia com conforto. Motor ${carData.engine} e câmbio ${carData.transmission} oferecem dirigibilidade macia no dia a dia. Ideal para quem busca um carro confiável e com ótimo custo-benefício."`

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://carbi.com.br',
      'X-Title': 'Carbi - Marketplace Automotivo',
    },
    body: JSON.stringify({
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
      messages: [
        {
          role: 'system',
          content: 'Você é um copywriter especializado em anúncios automotivos brasileiros. Gere descrições curtas, chamativas e otimizadas para SEO.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

export async function POST(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'API key não configurada' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { carData } = body

    if (!carData || !carData.brand || !carData.model) {
      return NextResponse.json(
        { error: 'Dados do veículo incompletos' },
        { status: 400 }
      )
    }

    const description = await generateDescription(carData)

    return NextResponse.json({ description })
  } catch (error) {
    console.error('Error generating description:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar descrição' },
      { status: 500 }
    )
  }
}
