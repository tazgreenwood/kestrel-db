import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Command, Code2, Zap, Database, Check } from 'lucide-react'
import { getModifierKey } from '../../utils/platform'

interface OnboardingModalProps {
  isOpen: boolean
  onComplete: () => void
}

const getOnboardingSteps = (modKey: string) => [
  {
    id: 'welcome',
    title: 'Welcome to Kestrel',
    subtitle: 'Precision Data Exploration',
    description:
      "A modern, keyboard-first MySQL client built for speed and efficiency. Let's get you started!",
    icon: <Database className="w-16 h-16 text-accent" />,
    features: [
      'Lightning-fast table navigation',
      'Powerful SQL editor with autocomplete',
      'Keyboard-first workflow',
      'Beautiful, customizable themes'
    ]
  },
  {
    id: 'command-palette',
    title: 'Command Palette',
    subtitle: 'Your gateway to everything',
    description: `Press ${modKey}+K anywhere to open the command palette. Search tables, switch databases, run actions - all without touching your mouse.`,
    icon: <Command className="w-16 h-16 text-accent" />,
    features: [
      `${modKey}+K - Open command palette`,
      'Type to search tables instantly',
      'Use > to switch databases',
      'Use ? to filter table data',
      'Use @ to switch connections'
    ]
  },
  {
    id: 'sql-editor',
    title: 'SQL Editor',
    subtitle: 'Write queries with confidence',
    description: `Press ${modKey}+/ to open the SQL editor. Execute custom queries with full autocomplete for tables and columns.`,
    icon: <Code2 className="w-16 h-16 text-accent" />,
    features: [
      `${modKey}+/ - Open SQL editor`,
      `${modKey}+Enter - Execute query`,
      `${modKey}+S - Save query for later`,
      'Smart autocomplete for tables & columns',
      'Query history and saved queries'
    ]
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    subtitle: 'Work at the speed of thought',
    description:
      'Kestrel is designed for keyboard-first navigation. Master these shortcuts to fly through your data.',
    icon: <Zap className="w-16 h-16 text-accent" />,
    features: [
      `${modKey}+K - Command palette`,
      `${modKey}+/ - SQL editor`,
      `${modKey}+, - Settings`,
      `${modKey}+R - Refresh table`,
      `${modKey}+T - Toggle view mode`,
      'hjkl - Navigate cells (Vim-style)'
    ]
  },
  {
    id: 'get-started',
    title: 'Ready to Connect',
    subtitle: "Let's set up your first database",
    description:
      "You're all set! Close this tour to create your first database connection and start exploring your data.",
    icon: <Check className="w-16 h-16 text-accent" />,
    features: [
      'Secure credential storage',
      'Multiple connections support',
      'Quick connection switching',
      'Color-coded connections'
    ]
  }
]

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const modKey = getModifierKey()
  const ONBOARDING_STEPS = getOnboardingSteps(modKey)
  const step = ONBOARDING_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-3xl w-full mx-4">
        {/* Modal Card */}
        <div className="bg-secondary border border-default rounded-lg shadow-2xl overflow-hidden">
          {/* Header with close button */}
          <div className="px-6 py-4 border-b border-default flex items-center justify-between">
            <div className="flex items-center gap-2">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-accent'
                      : index < currentStep
                        ? 'w-1.5 bg-accent/50'
                        : 'w-1.5 bg-border-default'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="text-tertiary hover:text-primary transition-colors p-1"
              title="Skip tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-8 py-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">{step.icon}</div>

            {/* Title & Subtitle */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-primary mb-2">{step.title}</h2>
              <p className="text-accent font-medium">{step.subtitle}</p>
            </div>

            {/* Description */}
            <p className="text-center text-secondary mb-8 max-w-xl mx-auto">{step.description}</p>

            {/* Features List */}
            <div className="bg-primary border border-default rounded-lg p-6 max-w-xl mx-auto">
              <ul className="space-y-3">
                {step.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                    </div>
                    <span className="text-sm text-secondary font-mono">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer with navigation */}
          <div className="px-6 py-4 border-t border-default flex items-center justify-between">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                isFirstStep
                  ? 'opacity-0 pointer-events-none'
                  : 'text-secondary hover:text-primary hover:bg-tertiary'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Step Indicator */}
            <div className="text-sm text-tertiary">
              {currentStep + 1} of {ONBOARDING_STEPS.length}
            </div>

            {/* Next/Finish Button */}
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              <span>{isLastStep ? 'Get Started' : 'Next'}</span>
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Skip hint */}
        {!isLastStep && (
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-sm text-tertiary hover:text-secondary transition-colors"
            >
              Skip tour
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
