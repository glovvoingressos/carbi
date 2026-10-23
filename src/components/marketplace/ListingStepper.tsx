'use client'

import { Car, Camera, Check, ClipboardCheck, UserRound, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

type StepDef = { id: number; label: string; description: string; icon: LucideIcon }

const STEPS: readonly StepDef[] = [
  { id: 1, label: 'Veículo', description: 'Placa e dados', icon: Car },
  { id: 2, label: 'Preço e fotos', description: 'Monte o anúncio', icon: Camera },
  { id: 3, label: 'Revisão', description: 'Confira e publique', icon: ClipboardCheck },
]

const ACCOUNT_STEP: StepDef = { id: 4, label: 'Conta', description: 'Cadastro rápido', icon: UserRound }

interface ListingStepperProps {
  currentStep: number
  onStepChange: (step: number) => void
  /** Acrescenta a 4ª etapa (conta), usada quando o usuário não está logado. */
  showAccountStep?: boolean
  /** `pill`: barra arredondada com ícones e pílula preta na etapa atual. */
  variant?: 'default' | 'pill'
}

export default function ListingStepper({
  currentStep,
  onStepChange,
  showAccountStep = false,
  variant = 'default',
}: ListingStepperProps) {
  const shouldReduceMotion = useReducedMotion()
  const steps = showAccountStep ? [...STEPS, ACCOUNT_STEP] : STEPS
  const isPill = variant === 'pill'

  return (
    <nav className={`listing-stepper${isPill ? ' listing-stepper-pill' : ''}`} aria-label="Progresso do anúncio">
      <ol className="listing-stepper-row">
        {steps.map((step, index) => {
          const isComplete = currentStep > step.id
          const isActive = currentStep === step.id
          const isLocked = currentStep < step.id
          const Icon = step.icon

          return (
            <li key={step.id} className="listing-stepper-node">
              <button
                type="button"
                className={`listing-stepper-button${isComplete ? ' is-complete' : ''}${isActive ? ' is-active' : ''}${isLocked ? ' is-locked' : ''}`}
                aria-label={`${isComplete ? 'Voltar para' : isActive ? 'Etapa atual:' : 'Ir para'} ${step.label}`}
                aria-current={isActive ? 'step' : undefined}
                disabled={isLocked || isActive}
                onClick={() => onStepChange(step.id)}
              >
                {isPill ? (
                  <motion.span
                    className="listing-stepper-icon"
                    initial={false}
                    animate={{ scale: isActive ? 1 : 0.94 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 26 }}
                    aria-hidden="true"
                  >
                    {isComplete ? <Check size={16} strokeWidth={2.5} /> : <Icon size={16} strokeWidth={1.8} />}
                  </motion.span>
                ) : (
                  <motion.span
                    className="listing-stepper-marker"
                    initial={false}
                    // O ativo fica em escala 1 (caixa de layout exata) e os inativos
                    // encolhem: escala > 1 transbordava 1.6px para fora de `main`,
                    // que tem overflow-x: clip, cortando a borda do círculo.
                    animate={{ scale: isActive ? 1 : 0.94 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 24 }}
                  >
                    {isComplete ? <Check size={14} strokeWidth={2.75} aria-hidden="true" /> : step.id}
                  </motion.span>
                )}
                <span className="listing-stepper-copy">
                  <strong>{step.label}</strong>
                  <small>{step.description}</small>
                </span>
              </button>

              {!isPill && index < steps.length - 1 ? (
                <span className="listing-stepper-connector" aria-hidden="true">
                  <motion.span
                    initial={false}
                    animate={{ scaleX: currentStep > step.id ? 1 : 0 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
                  />
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
