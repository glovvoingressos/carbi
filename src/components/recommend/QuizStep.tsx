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
        <span className="text-sm text-gray-500">
          Passo {stepNumber} de {totalSteps}
        </span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-2">{question}</h2>
      {description && <p className="text-gray-500 mb-6">{description}</p>}

      <div className="space-y-3">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedOption === i
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {option.icon}
              <div>
                <p className="font-medium text-gray-900">{option.label}</p>
                {option.description && (
                  <p className="text-sm text-gray-500">{option.description}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
