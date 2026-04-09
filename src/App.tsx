import { PayoutProvider, usePayout } from '@/context/PayoutContext';
import { StepIndicator } from '@/components/layout/StepIndicator';
import { Step1RoundInfo } from '@/components/wizard/Step1RoundInfo';
import { Step2DataEntry } from '@/components/wizard/Step2DataEntry';
import { Step3ReviewData } from '@/components/wizard/Step3ReviewData';
import { Step4KPWinners } from '@/components/wizard/Step4KPWinners';
import { Step5Confirm } from '@/components/wizard/Step5Confirm';
import { ResultsView } from '@/components/results/ResultsView';
import { RulesSidePanel } from '@/components/rules/RulesSidePanel';

const STEP_LABELS = ['Round Info', 'Upload Data', 'Review', 'KP Winners', 'Confirm'];

function AppContent() {
  const { state } = usePayout();
  const { currentStep } = state;

  const isResults = currentStep === 6;

  return (
    <div className="flex min-h-screen">
      {/* Main content */}
      <div className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-teal mb-1">⛳ Golf League Payouts</h1>
          <p className="text-text-muted">Calculate and distribute weekly payouts</p>
        </div>

        {!isResults && (
          <StepIndicator
            currentStep={currentStep}
            totalSteps={5}
            labels={STEP_LABELS}
          />
        )}

        {currentStep === 1 && <Step1RoundInfo />}
        {currentStep === 2 && <Step2DataEntry />}
        {currentStep === 3 && <Step3ReviewData />}
        {currentStep === 4 && <Step4KPWinners />}
        {currentStep === 5 && <Step5Confirm />}
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
