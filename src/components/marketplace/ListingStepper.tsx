'use client'

import { Check } from 'lucide-react'
import { motion } from 'motion/react'

const STEPS = [
  { id: 1, label: 'Veículo', description: 'Placa e dados' },
  { id: 2, label: 'Preço e fotos', description: 'Monte o anúncio' },
  { id: 3, label: 'Revisão', description: 'Confira e publique' },
] as const

interface ListingStepperProps {
  currentStep: number
  onStepChange: (step: number) => void
}

export default function ListingStepper({ currentStep, onStepChange }: ListingStepperProps) {
  return (
    <nav className="listing-stepper" aria-label="Progresso do anúncio">
      <ol className="listing-stepper-row">
        {STEPS.map((step, index) => {
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
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                >
                  {isComplete ? <Check size={14} strokeWidth={2.75} aria-hidden="true" /> : step.id}
                </motion.span>
                <span className="listing-stepper-copy">
                  <strong>{step.label}</strong>
                  <small>{step.description}</small>
                </span>
              </button>

              {index < STEPS.length - 1 ? (
                <span className="listing-stepper-connector" aria-hidden="true">
                  <motion.span
                    initial={false}
                    animate={{ scaleX: currentStep > step.id ? 1 : 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
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
