import { usePayout } from '@/context/PayoutContext';
import { calculatePayouts } from '@/lib/engine/calculate';
import { formatDate, formatCurrency } from '@/lib/format';

export function Step5Confirm() {
  const { state, dispatch } = usePayout();
  const realPlayers = state.players.filter(p => !p.isPro);
  const proCount = state.players.filter(p => p.isPro).length;
  const isOver32 = realPlayers.length >= state.rules.playerThreshold; // used for KP prize

  const handleCalculate = () => {
    const results = calculatePayouts(
      {
        round: state.round,
        players: state.players,
        slotTeams: state.slotTeams,
        deuces: state.deuces,
        parPointWinners: state.parPointWinners,
        kpWinners: state.kpWinners,
      },
      state.rules,
    );
    dispatch({ type: 'SET_RESULTS', payload: results });
    dispatch({ type: 'GO_TO_STEP', payload: 6 });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-teal">Confirm & Calculate</h2>
      <p className="text-text-muted">Review the summary below, then calculate payouts.</p>

      <div className="bg-card rounded-xl p-5 border border-border space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-dim uppercase tracking-wide text-xs">Date</span>
            <div className="text-text font-medium">{formatDate(state.round.date)}</div>
          </div>
          <div>
            <span className="text-text-dim uppercase tracking-wide text-xs">Field</span>
            <div className="text-text font-medium">
              {realPlayers.length} players{proCount > 0 ? ` + ${proCount} pros` : ''}
            </div>
          </div>
          <div>
            <span className="text-text-dim uppercase tracking-wide text-xs">KP Prize</span>
            <div className="text-text font-medium">
              {formatCurrency(isOver32 ? state.rules.kpPrizeOver32 : state.rules.kpPrizeUnder32)} each
            </div>
          </div>
          <div>
            <span className="text-text-dim uppercase tracking-wide text-xs">Payout Depth</span>
            <div className="text-text font-medium">
              Top {state.rules.splits.length}{' '}
              ({state.rules.splits.join('/')}%)
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-2 text-sm">
          {state.round.hasAce && (
            <div className="flex items-center gap-2">
              <span className="bg-red text-white text-xs font-bold px-2 py-0.5 rounded">ACE</span>
              <span>{state.round.aceWinner} — takes entire deuce pot</span>
            </div>
          )}
          <div className="text-text-muted">
            Slots: {state.slotTeams.slice(0, state.rules.splits.length).map(t =>
              `#${t.place} ${t.players.map(p => p.name.split(', ')[0]).join('/')}`
            ).join(' • ')}
          </div>
          <div className="text-text-muted">
            Par Points: {state.parPointWinners.slice(0, state.rules.splits.length).map(w => {
              const labels = ['1st', '2nd', '3rd', '4th', '5th'];
              return `${labels[w.place - 1]} ${w.player}`;
            }).join(' • ')}
          </div>
          <div className="text-text-muted">
            KPs: {state.kpWinners.length > 0
              ? state.kpWinners.map(k => `${k.hole}: ${k.player}`).join(' • ')
              : 'None / Pending'}
            {state.kpWinners.length < state.rules.kpHoles.length && state.kpWinners.length > 0 &&
              ` (${state.rules.kpHoles.length - state.kpWinners.length} pending)`}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 4 })}
          className="bg-card border border-border-accent text-text-muted font-medium px-6 py-3 rounded-lg hover:border-teal/50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleCalculate}
          className="bg-emerald text-background font-bold px-8 py-3 rounded-lg hover:bg-emerald/90 transition-colors text-lg"
        >
          Calculate Payouts 🧮
        </button>
      </div>
    </div>
  );
}
