import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Carbi',
  description: 'Como a Carbi coleta, usa e protege seus dados pessoais. Direitos do titular e contato com o DPO.',
  alternates: { canonical: '/privacidade' },
  openGraph: {
    title: 'Política de Privacidade | Carbi',
    description: 'Como a Carbi protege seus dados pessoais.',
    url: '/privacidade',
    type: 'website',
  },
}

const SECTIONS = [
  {
    title: 'Dados que coletamos',
    body: 'Coletamos dados que você nos fornece (nome, e-mail, telefone, dados do veículo) e dados automáticos de uso (endereço IP, dispositivo, páginas visitadas) para melhorar o produto e prevenir fraude.',
  },
  {
    title: 'Para que usamos',
    body: 'Exibir seus anúncios, conectar você a compradores interessados, validar identidade, prevenir golpes, enviar comunicações do serviço e cumprir obrigações legais. Não vendemos seus dados.',
  },
  {
    title: 'Compartilhamento',
    body: 'Compartilhamos dados apenas com prestadores essenciais (hospedagem, e-mail, FIPE, autenticação), com autoridades quando exigido por lei, e entre comprador e vendedor dentro do chat quando necessário para a negociação.',
  },
  {
    title: 'Cookies e analytics',
    body: 'Usamos cookies essenciais para login e preferências, e cookies analíticos (Google Analytics) para entender o uso do site. Você pode desativar cookies não essenciais nas configurações do seu navegador.',
  },
  {
    title: 'Seus direitos (LGPD)',
    body: 'Você pode pedir acesso, correção, anonimização, portabilidade ou eliminação dos seus dados a qualquer momento, além de revogar consentimentos. Para exercer, escreva para privacidade@carbi.com.br.',
  },
  {
    title: 'Segurança',
    body: 'Aplicamos medidas técnicas e organizacionais para proteger seus dados: HTTPS, criptografia em repouso, controle de acesso por função, logs auditáveis e revisões periódicas.',
  },
  {
    title: 'Retenção',
    body: 'Mantemos seus dados enquanto sua conta estiver ativa e pelo período exigido por lei após o encerramento. Anúncios podem permanecer públicos em formato anonimizado para preservar o histórico do veículo.',
  },
  {
    title: 'Mudanças nesta política',
    body: 'Podemos atualizar esta política. Avisaremos por e-mail e/ou aviso na plataforma. A versão atual estará sempre disponível nesta página com a data da última atualização.',
  },
] as const

export default function PrivacidadePage() {
  return (
    <main className="cb-page">
      <section className="cb-section-pad">
        <div className="cb-wrap cb-legal-wrap">
          <p className="cb-eyebrow">Política de Privacidade</p>
          <h1 style={{ maxWidth: '20ch' }}>Seus dados, seu controle</h1>
          <p className="cb-lead" style={{ maxWidth: '60ch' }}>
            A Carbi trata dados pessoais com cuidado. Esta página explica o que
            coletamos, por que coletamos e como você pode controlar.
          </p>
          <p style={{ color: 'var(--cb-ink-faint)', fontSize: 13 }}>
            Última atualização: setembro de 2026
          </p>

          <div className="cb-legal-content">
            {SECTIONS.map((s) => (
              <article key={s.title} className="cb-legal-block">
                <h2>{s.title}</h2>
                <p>{s.body}</p>
              </article>
            ))}

            <div className="cb-legal-callout">
              <p>
                Dúvidas sobre privacidade? Escreva para{' '}
                <a href="mailto:privacidade@carbi.com.br">privacidade@carbi.com.br</a> ou{' '}
                <Link href="/contato">fale com a gente</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}