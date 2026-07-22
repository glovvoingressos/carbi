import { NextRequest, NextResponse } from 'next/server'
import { analyzeCarImage, generateListingFromImages } from '@/lib/integrations/nvidia/vision'

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json()
    if (!images?.length || images.length > 5) {
      return NextResponse.json({ error: 'Envie de 1 a 5 imagens.' }, { status: 400 })
    }

    const [analysis, listing] = await Promise.all([
      analyzeCarImage(images[0]),
      generateListingFromImages(images.slice(0, 4)),
    ])

    return NextResponse.json({ analysis, listing })
  } catch (error) {
    console.error('AI analyze error:', error)
    return NextResponse.json({ error: 'Erro ao analisar imagens.' }, { status: 500 })
  }
}
