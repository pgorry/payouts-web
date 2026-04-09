import { useState, useEffect } from 'react';
import { usePayout } from '@/context/PayoutContext';
import { calculatePayouts } from '@/lib/engine/calculate';
import { formatPlace } from '@/lib/format';
import { SPLIT_PRESETS, getDefaultPlaces } from '@/lib/rules/defaults';
import type { KPWinner } from '@/types';

export function Step2Confirm() {
  const { state, dispatch } = usePayout();
  const realPlayers = state.players.filter(p => !p.isPro);
  const proCount = state.players.filter(p => p.isPro).length;
  const { round } = state;
  const holes = state.rules.kpHoles;
  const currentPlaces = state.rules.splits.length;
  const defaultPlaces = getDefaultPlaces(realPlayers.length);

  const [showKPs, setShowKPs] = useState(false);

  // KP state
  const [kpEntries, setKpEntries] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const hole of holes) {
      const existing = state.kpWinners.find(kp => kp.hole === hole);
      initial[hole] = existing?.player ?? '';
    }
    return initial;
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeHole, setActiveHole] = useState<string | null>(null);
  const [showAceSuggestions, setShowAceSuggestions] = useState(false);
  const [aceSearch, setAceSearch] = useState(round.aceWinner ?? '');

  const playerNames = state.players.filter(p => !p.isPro).map(p => p.name);

  const handleKPChange = (hole: string, value: string) => {
    setKpEntries(prev => ({ ...prev, [hole]: value }));
    setActiveHole(hole);
    if (value.length > 0) {
      setSuggestions(playerNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (hole: string, name: string) => {
    setKpEntries(prev => ({ ...prev, [hole]: name }));
    setSuggestions([]);
    setActiveHole(null);
  };

  const handleAceSearch = (value: string) => {
    setAceSearch(value);
    dispatch({ type: 'SET_ROUND', payload: { ...round, hasAce: true, aceWinner: value } });
    setShowAceSuggestions(value.length > 0);
  };

  const selectAceWinner = (name: string) => {
    setAceSearch(name);
    dispatch({ type: 'SET_ROUND', payload: { ...round, hasAce: true, aceWinner: name } });
    setShowAceSuggestions(false);
  };

  const aceSuggestions = playerNames.filter(name =>
    name.toLowerCase().includes(aceSearch.toLowerCase())
  ).slice(0, 5);

  useEffect(() => {
    const kpWinners: KPWinner[] = holes
      .filter(hole => kpEntries[hole]?.trim())
      .map(hole => ({ hole, player: kpEntries[hole].trim() }));
    dispatch({ type: 'SET_KP_WINNERS', payload: kpWinners });
  }, [kpEntries, holes, dispatch]);

  const setPlaces = (n: number) => {
    dispatch({ type: 'SET_RULES', payload: { ...state.rules, splits: SPLIT_PRESETS[n] } });
  };

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
    dispatch({ type: 'GO_TO_STEP', payload: 3 });
  };

  const filledKPs = Object.values(kpEntries).filter(v => v.trim()).length;
  const totalKPs = holes.length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-teal">Confirm & Calculate</h2>

      {/* Date */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-text-dim text-xs uppercase tracking-wide mb-1">Round Date</label>
            <input
              type="date"
              value={round.date}
              onChange={(e) =>
                dispatch({ type: 'SET_ROUND', payload: { ...round, date: e.target.value } })
              }
              className="w-full bg-background border border-border-accent rounded-lg px-4 py-2 text-text text-sm focus:outline-none focus:border-teal"
            />
          </div>
          <div>
            <span className="text-text-dim text-xs uppercase tracking-wide">Field</span>
            <div className="text-text font-medium mt-1">
              {realPlayers.length} players{proCount > 0 ? ` + ${proCount} pros` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-3 text-sm">
        <div className="text-text-muted">
          Slots: {state.slotTeams.slice(0, currentPlaces).map(t =>
            `#${t.place} ${t.players.map(p => p.name.split(', ')[0]).join('/')}`
          ).join(' • ')}
        </div>
        <div className="text-text-muted">
          Par Points: {state.parPointWinners.slice(0, currentPlaces).map((w, i) =>
            `${formatPlace(i + 1)} ${w.player}`
          ).join(' • ')}
        </div>
        <div className="text-text-muted">
          Deuces: {state.deuces.length > 0
            ? state.deuces.map(d => `${d.player}${d.instances > 1 ? ` x${d.instances}` : ''}`).join(', ')
            : 'None'}
        </div>
      </div>

      {/* Places to Pay */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-text-dim text-xs uppercase tracking-wide">Places to Pay</span>
            <span className="text-text-dim text-xs ml-2">
              (default: {defaultPlaces} for {realPlayers.length} players)
            </span>
          </div>
          <div className="flex gap-1">
            {[2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setPlaces(n)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  currentPlaces === n
                    ? 'bg-teal text-background'
                    : 'bg-card-highlight text-text-muted hover:text-text border border-border-accent'
                }`}
              >
                Top {n}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-1 text-text-dim text-xs">
          Split: {state.rules.splits.join(' / ')}%
        </div>
      </div>

      {/* KP & Ace Section (collapsible) */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setShowKPs(!showKPs)}
          className="w-full flex items-center justify-between p-4 hover:bg-card-highlight transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text">KP Winners & Ace</span>
            <span className="text-text-dim text-xs">
              {filledKPs}/{totalKPs} entered
              {round.hasAce && ' • Ace'}
            </span>
          </div>
          <span className="text-text-dim text-sm">{showKPs ? '▲' : '▼'}</span>
        </button>

        {showKPs && (
          <div className="border-t border-border p-4 space-y-4">
            {/* Ace */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide">Ace</h4>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    dispatch({ type: 'SET_ROUND', payload: { ...round, hasAce: false, aceWinner: undefined } });
                    setAceSearch('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !round.hasAce
                      ? 'bg-teal text-background'
                      : 'bg-card-highlight border border-border-accent text-text-muted'
                  }`}
                >
                  No Ace
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_ROUND', payload: { ...round, hasAce: true } })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    round.hasAce
                      ? 'bg-red text-white'
                      : 'bg-card-highlight border border-border-accent text-text-muted'
                  }`}
                >
                  Ace!
                </button>
              </div>
              {round.hasAce && (
                <div className="relative">
                  <input
                    type="text"
                    value={aceSearch}
                    onChange={(e) => handleAceSearch(e.target.value)}
                    onFocus={() => aceSearch.length > 0 && setShowAceSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowAceSuggestions(false), 200)}
                    placeholder="Ace winner..."
                    className="w-full bg-background border border-border-accent rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-teal"
                  />
                  {showAceSuggestions && aceSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-card border border-border-accent rounded-lg shadow-lg overflow-hidden">
                      {aceSuggestions.map((name) => (
                        <button
                          key={name}
                          onMouseDown={() => selectAceWinner(name)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-card-highlight text-text"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* KP Holes */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Closest to Pin
              </h4>
              <p className="text-text-dim text-xs">Leave blank if no winner — money goes back to pot</p>
              <div className="grid grid-cols-2 gap-3">
                {holes.map((hole) => (
                  <div key={hole} className="relative">
                    <label className="block text-xs text-text-dim mb-1">Hole {hole}</label>
                    <input
                      type="text"
                      value={kpEntries[hole] ?? ''}
                      onChange={(e) => handleKPChange(hole, e.target.value)}
                      onFocus={() => setActiveHole(hole)}
                      onBlur={() => setTimeout(() => { setActiveHole(null); setSuggestions([]); }, 200)}
                      placeholder="Player name"
                      className="w-full bg-background border border-border-accent rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-teal"
                    />
                    {activeHole === hole && suggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-card border border-border-accent rounded-lg shadow-lg overflow-hidden">
                        {suggestions.map((name) => (
                          <button
                            key={name}
                            onMouseDown={() => selectSuggestion(hole, name)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-card-highlight text-text"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 1 })}
          className="bg-card border border-border-accent text-text-muted font-medium px-6 py-3 rounded-lg hover:border-teal/50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleCalculate}
          className="bg-emerald text-background font-bold px-8 py-3 rounded-lg hover:bg-emerald/90 transition-colors text-lg"
        >
          Calculate Payouts
        </button>
      </div>
    </div>
  );
}
