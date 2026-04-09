interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                  isCompleted
                    ? 'bg-teal text-background'
                    : isActive
                      ? 'bg-teal/20 text-teal border-2 border-teal'
                      : 'bg-card text-text-dim border border-border-accent'
                }`}
              >
                {isCompleted ? '✓' : step}
              </div>
              <span
                className={`text-sm truncate ${
                  isActive ? 'text-teal font-medium' : isCompleted ? 'text-text-muted' : 'text-text-dim'
                }`}
              >
                {labels[i]}
              </span>
            </div>
            {step < totalSteps && (
              <div
                className={`h-px flex-1 ${
                  isCompleted ? 'bg-teal/50' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
