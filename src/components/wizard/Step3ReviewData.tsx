import { usePayout } from '@/context/PayoutContext';
import { SPLIT_PRESETS, getDefaultPlaces } from '@/lib/rules/defaults';
import { formatPlace } from '@/lib/format';

export function Step3ReviewData() {
  const { state, dispatch } = usePayout();
  const realPlayers = state.players.filter(p => !p.isPro);
  const proPlayers = state.players.filter(p => p.isPro);
  const currentPlaces = state.rules.splits.length;
  const defaultPlaces = getDefaultPlaces(realPlayers.length);

  const setPlaces = (n: number) => {
    dispatch({ type: 'SET_RULES', payload: { ...state.rules, splits: SPLIT_PRESETS[n] } });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-teal">Review Data</h2>
      <p className="text-text-muted">Verify the extracted data before proceeding. You can edit values if needed.</p>

      {/* Players */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
          Players ({realPlayers.length}{proPlayers.length > 0 ? ` + ${proPlayers.length} pros` : ''})
        </h3>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {state.players.map((p, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                p.isPro ? 'text-text-dim italic' : 'text-text'
              }`}
            >
              <span>{p.name}{p.isPro ? ' (Pro)' : ''}</span>
              <span className="text-text-muted">{p.parPoints ?? '—'} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Slot Teams */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
          Slot Teams (Top {state.slotTeams.length})
        </h3>
        <div className="space-y-2">
          {state.slotTeams.map((team) => (
            <div key={team.place} className="flex items-center gap-3 px-3 py-2 rounded bg-card-highlight text-sm">
              <span className="text-teal font-semibold w-8">#{team.place}</span>
              <span className="flex-1">
                {team.players.map(p => (
                  <span key={p.name} className={p.isPro ? 'text-text-dim line-through' : ''}>
                    {p.name}
                  </span>
                )).reduce<React.ReactNode[]>((acc, el, i) => {
                  if (i > 0) acc.push(<span key={`sep-${i}`} className="text-text-dim"> / </span>);
                  acc.push(el);
                  return acc;
                }, [])}
              </span>
              {team.netScore !== undefined && (
                <span className="text-text-muted">{team.netScore}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Par Point Winners */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
          Par Points Leaders
        </h3>
        <div className="space-y-1">
          {state.parPointWinners.map((w) => (
            <div key={w.place} className="flex items-center justify-between px-3 py-1.5 text-sm">
              <span>
                <span className="text-teal font-semibold mr-2">
                  {formatPlace(w.place)}
                </span>
                {w.player}
              </span>
              <span className="text-text-muted">{w.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Deuces */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
          Deuces {state.round.hasAce && <span className="text-red ml-2">(Overridden by Ace)</span>}
        </h3>
        {state.deuces.length > 0 ? (
          <div className="space-y-1">
            {state.deuces.map((d, i) => (
              <div key={i} className={`flex items-center justify-between px-3 py-1.5 text-sm ${state.round.hasAce ? 'text-text-dim line-through' : ''}`}>
                <span>{d.player}</span>
                <span className="text-text-muted">x{d.instances}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-text-dim text-sm px-3">No deuces recorded</div>
        )}
        {state.round.hasAce && state.round.aceWinner && (
          <div className="mt-2 px-3 py-2 bg-red/10 rounded-lg text-sm">
            <span className="text-red font-semibold">🏌️ Ace: {state.round.aceWinner}</span>
            <span className="text-text-muted"> — takes entire deuce pot</span>
          </div>
        )}
      </div>

      {/* Places to Pay */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
          Places to Pay
          <span className="text-text-dim text-xs ml-2 normal-case">
            (default: {defaultPlaces} for {realPlayers.length} players)
          </span>
        </h3>
        <div className="flex gap-2">
          {[2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setPlaces(n)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPlaces === n
                  ? 'bg-teal text-background'
                  : 'bg-card-highlight text-text-muted hover:text-text border border-border-accent'
              }`}
            >
              Top {n}
            </button>
          ))}
        </div>
        <div className="mt-2 text-text-dim text-xs">
          Split: {state.rules.splits.join(' / ')}%
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 2 })}
          className="bg-card border border-border-accent text-text-muted font-medium px-6 py-3 rounded-lg hover:border-teal/50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 4 })}
          className="bg-teal text-background font-semibold px-6 py-3 rounded-lg hover:bg-teal/90 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
