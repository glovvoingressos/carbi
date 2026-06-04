import type { ReactNode } from 'react'

interface QuizStepProps {
  stepNumber: number
  totalSteps: number
  question: string
  description?: string
  options: { label: string; description?: string; icon?: ReactNode }[]
  selectedOption: number | null
  onSelect: (index: number) => void
}

export default function QuizStep({
  stepNumber,
  totalSteps,
  question,
  description,
  options,
  selectedOption,
  onSelect,
}: QuizStepProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-[#525252]">
          Passo {stepNumber} de {totalSteps}
        </span>
        <div className="flex-1 h-2 bg-[#FAFAF9] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#10B981] rounded-full transition-all duration-500"
            style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="text-2xl font-display text-[#0A0A0A] mb-2">{question}</h2>
      {description && <p className="text-[#525252] mb-6">{description}</p>}

      <div className="space-y-3">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedOption === i
                ? 'border-[#10B981] bg-[#FAFAF9] shadow-sm'
                : 'border-[#EAEAE8] bg-white hover:bg-[#FAFAF9]/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {option.icon && <div className="text-[#10B981]">{option.icon}</div>}
              <div>
                <p className="font-semibold text-[#0A0A0A]">{option.label}</p>
                {option.description && (
                  <p className="text-sm text-[#525252]">{option.description}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
