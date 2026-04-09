import { PayoutProvider, usePayout } from '@/context/PayoutContext';
import { StepIndicator } from '@/components/layout/StepIndicator';
import { Step2DataEntry } from '@/components/wizard/Step2DataEntry';
import { Step2Confirm } from '@/components/wizard/Step2Confirm';
import { ResultsView } from '@/components/results/ResultsView';
import { RulesSidePanel } from '@/components/rules/RulesSidePanel';

const STEP_LABELS = ['Upload Data', 'Confirm'];

function AppContent() {
  const { state } = usePayout();
  const { currentStep } = state;

  const isResults = currentStep === 3;

  return (
    <div className="flex min-h-screen">
      {/* Main content */}
      <div className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-teal mb-1 flex items-center gap-2">
            <img src="UGC-Logo-2.png" alt="UGC" className="h-9 w-auto bg-white/90 rounded-lg p-0.5" />
            UGC Weekend Mens - Payout Calculator
          </h1>
          <p className="text-text-muted">Calculate and distribute weekly payouts</p>
        </div>

        {!isResults && (
          <StepIndicator
            currentStep={currentStep}
            totalSteps={2}
            labels={STEP_LABELS}
          />
        )}

        {currentStep === 1 && <Step2DataEntry />}
        {currentStep === 2 && <Step2Confirm />}
        {isResults && <ResultsView />}
      </div>

      {/* Rules side panel */}
      <div className="hidden lg:block">
        <RulesSidePanel />
      </div>
    </div>
  );
}

function App() {
  return (
    <PayoutProvider>
      <AppContent />
    </PayoutProvider>
  );
}

export default App;
