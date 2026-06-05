import { Metadata } from 'next'
import AuthCard from '@/components/marketplace/AuthCard'

export const metadata: Metadata = {
  title: 'Entrar | Carbi',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginPage() {
  return (
    <div className="container max-w-lg px-4 pb-16 pt-28">
      <AuthCard redirectTo="/minha-conta" />
    </div>
  )
}
