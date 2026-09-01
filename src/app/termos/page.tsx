import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos de Uso | Carbi',
  description: 'Termos e condições de uso da plataforma Carbi — marketplace de veículos com anúncios e chat interno.',
  alternates: { canonical: '/termos' },
  openGraph: {
    title: 'Termos de Uso | Carbi',
    description: 'Termos e condições de uso da plataforma Carbi.',
    url: '/termos',
    type: 'website',
  },
}

const SECTIONS = [
  {
    title: '1. Aceitação',
    body: 'Ao criar uma conta ou usar a Carbi de qualquer forma, você concorda com estes Termos e com a nossa Política de Privacidade. Se não concordar, não use a plataforma.',
  },
  {
    title: '2. Cadastro e conta',
    body: 'Para anunciar ou negociar você precisa de uma conta válida. Você é responsável por manter suas credenciais em sigilo e por toda atividade que acontecer na sua conta. Avise a gente imediatamente se suspeitar de acesso não autorizado.',
  },
  {
    title: '3. Anúncios',
    body: 'O anunciante é o único responsável pelo conteúdo do anúncio, pelas informações do veículo (ano, km, estado, preço) e pelas fotos. Anúncios devem ser reais, do próprio veículo, sem omissão de defeitos relevantes. A Carbi pode remover anúncios que violem leis ou estes Termos.',
  },
  {
    title: '4. Preço e visibilidade',
    body: 'A Carbi oferece um plano gratuito e planos pagos (Pro). Planos Pro oferecem recursos adicionais como selo de verificação, destaque e prioridade nas buscas. Os preços e recursos vigentes estão na página de planos. A Carbi não cobra comissão sobre a venda — toda negociação é direta entre as partes.',
  },
  {
    title: '5. Chat e comunicação',
    body: 'O chat interno é o canal recomendado. Não compartilhe telefone, documentos ou dados bancários antes de validar a outra parte. A Carbi não se responsabiliza por transações realizadas fora da plataforma ou por golpes entre usuários, mas pode intermediar disputas e tomar medidas contra contas fraudulentas.',
  },
  {
    title: '6. Conteúdo do usuário',
    body: 'Você mantém os direitos sobre fotos e descrições que envia, mas nos concede uma licença não exclusiva de exibição na plataforma. Não publique conteúdo que viole direitos de terceiros, seja ilegal, ofensivo ou enganoso.',
  },
  {
    title: '7. Propriedade intelectual',
    body: 'A marca Carbi, o logo, o código e o design da plataforma são de nossa propriedade. Você não pode copiá-los ou redistribuí-los sem autorização.',
  },
  {
    title: '8. Limitação de responsabilidade',
    body: 'A Carbi é uma vitrine de anúncios e ferramenta de comunicação. Não somos parte das negociações entre compradores e vendedores. Não garantimos a veracidade das informações publicadas por terceiros nem o resultado de qualquer negociação.',
  },
  {
    title: '9. Suspensão e encerramento',
    body: 'Podemos suspender ou encerrar contas que violem estes Termos, cometam fraude ou prejudiquem outros usuários. Em caso de encerramento por nossa iniciativa sem motivo justo, devolvemos proporcionalmente valores de planos Pro.',
  },
  {
    title: '10. Mudanças nos Termos',
    body: 'Podemos atualizar estes Termos para refletir mudanças no produto ou na legislação. Avisaremos por e-mail e/ou aviso na plataforma. O uso continuado após a mudança significa aceitação.',
  },
  {
    title: '11. Foro',
    body: 'Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca do consumidor para dirimir qualquer controvérsia.',
  },
] as const

export default function TermosPage() {
  return (
    <main className="cb-page">
      <section className="cb-section-pad">
        <div className="cb-wrap cb-legal-wrap">
          <p className="cb-eyebrow">Termos de Uso</p>
          <h1 style={{ maxWidth: '20ch' }}>As regras da casa</h1>
          <p className="cb-lead" style={{ maxWidth: '60ch' }}>
            Este documento descreve os termos e condições para usar a Carbi.
            Lê com calma — é o que vale quando você anuncia, busca ou negocia por aqui.
          </p>
          <p style={{ color: 'var(--cb-ink-faint)', fontSize: 13 }}>
            Última atualização: setembro de 2026
          </p>

          <div className="cb-legal-toc">
            <p className="cb-eyebrow">Sumário</p>
            <ol>
              {SECTIONS.map((s) => (
                <li key={s.title}><a href={`#${s.title.split('.')[0]}`}>{s.title}</a></li>
              ))}
            </ol>
          </div>

          <div className="cb-legal-content">
            {SECTIONS.map((s) => {
              const id = s.title.split('.')[0]
              return (
                <article key={s.title} id={id} className="cb-legal-block">
                  <h2>{s.title.replace(/^\d+\.\s*/, '')}</h2>
                  <p>{s.body}</p>
                </article>
              )
            })}

            <div className="cb-legal-callout">
              <p>
                Dúvidas sobre estes Termos?{' '}
                <Link href="/contato">Fale com a gente</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}