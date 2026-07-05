'use client'

import { useState, useEffect } from 'react'

interface FlowProgressProps {
  steps: string[]
  currentStep: number
}

export default function FlowProgress({ steps, currentStep }: FlowProgressProps) {
  const [animatedStep, setAnimatedStep] = useState(currentStep)

  useEffect(() => {
    setAnimatedStep(currentStep)
  }, [currentStep])

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="ref-flow-progress" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps.length} aria-label="Progresso do anúncio">
      <div className="ref-flow-progress-bar">
        <div className="ref-flow-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="ref-flow-progress-steps">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`ref-flow-progress-step ${index < animatedStep ? 'completed' : ''} ${index === animatedStep ? 'active' : ''} ${index > animatedStep ? 'pending' : ''}`}
          >
            <span className="ref-flow-progress-dot">
              {index < animatedStep ? '✓' : index + 1}
            </span>
            <span className="ref-flow-progress-label">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
