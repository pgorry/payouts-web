import { usePayout } from '@/context/PayoutContext';

export function Step1RoundInfo() {
  const { state, dispatch } = usePayout();
  const { round } = state;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-teal">Round Information</h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-muted uppercase tracking-wide">
          Round Date
        </label>
        <input
          type="date"
          value={round.date}
          onChange={(e) =>
            dispatch({ type: 'SET_ROUND', payload: { ...round, date: e.target.value } })
          }
          className="w-full bg-card border border-border-accent rounded-lg px-4 py-3 text-text focus:outline-none focus:border-teal"
        />
      </div>

      <button
        onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 2 })}
        className="bg-teal text-background font-semibold px-6 py-3 rounded-lg hover:bg-teal/90 transition-colors"
      >
        Next →
      </button>
    </div>
  );
}
