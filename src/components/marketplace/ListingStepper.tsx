'use client'

import { Check } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

const STEPS = [
  { id: 1, label: 'Veículo', description: 'Placa e dados' },
  { id: 2, label: 'Preço e fotos', description: 'Monte o anúncio' },
  { id: 3, label: 'Revisão', description: 'Confira e publique' },
] as const

const ACCOUNT_STEP = { id: 4, label: 'Conta', description: 'Cadastro rápido' } as const

interface ListingStepperProps {
  currentStep: number
  onStepChange: (step: number) => void
  /** Acrescenta a 4ª etapa (conta), usada quando o usuário não está logado. */
  showAccountStep?: boolean
}

export default function ListingStepper({ currentStep, onStepChange, showAccountStep = false }: ListingStepperProps) {
  const shouldReduceMotion = useReducedMotion()
  const steps = showAccountStep ? [...STEPS, ACCOUNT_STEP] : STEPS

  return (
    <nav className="listing-stepper" aria-label="Progresso do anúncio">
      <ol className="listing-stepper-row">
        {steps.map((step, index) => {
          const isComplete = currentStep > step.id
          const isActive = currentStep === step.id
          const isLocked = currentStep < step.id

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
                <motion.span
                  className="listing-stepper-marker"
                  initial={false}
                  animate={{ scale: isActive ? 1.08 : 1 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 24 }}
                >
                  {isComplete ? <Check size={14} strokeWidth={2.75} aria-hidden="true" /> : step.id}
                </motion.span>
                <span className="listing-stepper-copy">
                  <strong>{step.label}</strong>
                  <small>{step.description}</small>
                </span>
              </button>

              {index < steps.length - 1 ? (
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
