import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ estado: string }> }) {
  await params
  notFound()
}

export default async function CarrosMaisVendidosEstadoPage({
  params,
}: {
  params: Promise<{ estado: string }>
}) {
  await params
  notFound()
}
